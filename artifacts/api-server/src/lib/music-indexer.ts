import fs from "fs/promises";
import path from "path";
import { db, songsTable, musicFilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { broadcast } from "./websocket";
import { logger } from "./logger";

let watchedFolder: string | null = null;
let scanInProgress = false;

export function getMusicWatchFolder(): string | null {
  return watchedFolder;
}

export function setMusicWatchFolder(folderPath: string): void {
  watchedFolder = folderPath;
  void fullScan(folderPath);
}

export function initMusicIndexer(): void {
  const folder =
    process.env["MUSIC_FOLDER"] ??
    path.resolve(process.cwd(), "config", "musicas");
  logger.info({ folder }, "Initialising music indexer");
  watchedFolder = folder;
  void fullScan(folder);
}

// ── File classification ────────────────────────────────────────────────────────

type FileType = "mp3" | "pb" | "lyrics";

/**
 * Classify a file by its name.
 * Returns null for files we don't care about.
 *
 * Detection order matters:
 *   1. "- PB.mp3" suffix  → playback-only track
 *   2. ".mp3"             → normal audio
 *   3. ".txt"             → lyric file
 */
function classifyFile(filename: string): FileType | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith("- pb.mp3") || lower.endsWith("-pb.mp3")) return "pb";
  if (lower.endsWith(".mp3")) return "mp3";
  if (lower.endsWith(".txt")) return "lyrics";
  return null;
}

/**
 * Derive a candidate song title from a filename.
 * Strips extension (and "- PB" suffix for playback files),
 * then replaces hyphens/underscores with spaces and trims.
 */
function titleFromFilename(filename: string, type: FileType): string {
  if (type === "pb") {
    return filename
      .replace(/\s*-\s*PB\.mp3$/i, "")
      .replace(/\.mp3$/i, "")
      .replace(/[-_]/g, " ")
      .trim();
  }
  if (type === "mp3") {
    return filename.replace(/\.mp3$/i, "").replace(/[-_]/g, " ").trim();
  }
  return filename.replace(/\.txt$/i, "").replace(/[-_]/g, " ").trim();
}

// ── Recursive filesystem walk ──────────────────────────────────────────────────

interface RawFile {
  filePath: string;
  filename: string;
}

async function collectFiles(dir: string): Promise<RawFile[]> {
  const results: RawFile[] = [];

  async function walk(current: string): Promise<void> {
    let entries;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile()) {
        results.push({ filePath: fullPath, filename: entry.name });
      }
    }
  }

  await walk(dir);
  return results;
}

// ── Full scan ─────────────────────────────────────────────────────────────────

export interface ScanResult {
  scanned: number;
  linked: number;
  lyrics: number;
  removed: number;
}

export async function fullScan(folder: string): Promise<ScanResult> {
  if (scanInProgress) {
    logger.warn("Scan already in progress — skipping");
    return { scanned: 0, linked: 0, lyrics: 0, removed: 0 };
  }
  scanInProgress = true;

  try {
    await fs.mkdir(folder, { recursive: true });

    const allFiles = await collectFiles(folder);
    const relevantFiles = allFiles.filter(
      (f) => classifyFile(f.filename) !== null
    );

    const allSongs = await db
      .select({ id: songsTable.id, title: songsTable.title })
      .from(songsTable);

    const existingRows = await db
      .select({ filePath: musicFilesTable.filePath })
      .from(musicFilesTable);
    const existingPaths = new Set(existingRows.map((r) => r.filePath));
    const scannedPaths = new Set<string>();

    let linked = 0;
    let lyricsCount = 0;

    for (const { filePath, filename } of relevantFiles) {
      const type = classifyFile(filename)!;
      scannedPaths.add(filePath);

      let stat: { size: number; mtimeMs: number } | null = null;
      try {
        const s = await fs.stat(filePath);
        stat = { size: s.size, mtimeMs: s.mtimeMs };
      } catch {
        continue;
      }

      const candidateTitle = titleFromFilename(filename, type);
      const match = allSongs.find(
        (s) => s.title.toLowerCase() === candidateTitle.toLowerCase()
      );

      const now = new Date().toISOString();
      const record = {
        filePath,
        filename,
        type,
        songId: match?.id ?? null,
        sizeBytes: stat.size,
        lastModified: new Date(stat.mtimeMs).toISOString(),
        indexedAt: now,
      };

      await db
        .insert(musicFilesTable)
        .values(record)
        .onConflictDoUpdate({
          target: musicFilesTable.filePath,
          set: {
            filename: record.filename,
            type: record.type,
            songId: record.songId,
            sizeBytes: record.sizeBytes,
            lastModified: record.lastModified,
            indexedAt: record.indexedAt,
          },
        });

      if (match) {
        if (type === "mp3" || type === "pb") {
          await db
            .update(songsTable)
            .set({ mp3Path: filePath })
            .where(eq(songsTable.id, match.id));
          linked++;
          broadcast({
            type: "music_indexed",
            data: { songId: match.id, title: match.title, filePath },
          });
          logger.info(
            { songId: match.id, title: match.title, type },
            "Music file linked to song"
          );
        }
        if (type === "lyrics") lyricsCount++;
      }
    }

    const removedPaths = [...existingPaths].filter(
      (p) => !scannedPaths.has(p)
    );
    for (const p of removedPaths) {
      await db
        .delete(musicFilesTable)
        .where(eq(musicFilesTable.filePath, p));
    }

    const result: ScanResult = {
      scanned: relevantFiles.length,
      linked,
      lyrics: lyricsCount,
      removed: removedPaths.length,
    };
    logger.info(result, "Music scan complete");
    return result;
  } finally {
    scanInProgress = false;
  }
}
