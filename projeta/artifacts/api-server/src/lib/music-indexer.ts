import chokidar from "chokidar";
import path from "path";
import { db, songsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { broadcast } from "./websocket";
import { logger } from "./logger";

let watcher: chokidar.FSWatcher | null = null;
let watchedFolder: string | null = null;

/** Start watching a new music folder (stops any previous watcher first). */
export function setMusicWatchFolder(folderPath: string): void {
  if (watcher) {
    void watcher.close();
    watcher = null;
  }
  watchedFolder = folderPath;
  startWatcher(folderPath);
}

export function getMusicWatchFolder(): string | null {
  return watchedFolder;
}

/** Bootstrap the indexer with the default or env-configured folder. */
export function initMusicIndexer(): void {
  const folder =
    process.env.MUSIC_FOLDER ?? path.resolve(process.cwd(), "config", "musicas");
  logger.info({ folder }, "Initialising music indexer");
  setMusicWatchFolder(folder);
}

// ── Internal helpers ──────────────────────────────────────────────────────────

async function indexFile(filePath: string): Promise<void> {
  if (!filePath.toLowerCase().endsWith(".mp3")) return;

  const candidateTitle = path
    .basename(filePath)
    .replace(/\.mp3$/i, "")
    .replace(/[-_]/g, " ")
    .trim();

  try {
    const songs = await db
      .select({ id: songsTable.id, title: songsTable.title })
      .from(songsTable);

    const match = songs.find(
      (s) => s.title.toLowerCase() === candidateTitle.toLowerCase()
    );

    if (match) {
      await db
        .update(songsTable)
        .set({ mp3Path: filePath })
        .where(eq(songsTable.id, match.id));

      broadcast({
        type: "music_indexed",
        data: { songId: match.id, title: match.title, filePath },
      });
      logger.info({ songId: match.id, title: match.title }, "Music file linked to song");
    }
  } catch (err) {
    logger.error({ err, filePath }, "Failed to index music file");
  }
}

async function unlinkFile(filePath: string): Promise<void> {
  try {
    const songs = await db
      .select({ id: songsTable.id, mp3Path: songsTable.mp3Path })
      .from(songsTable);

    const match = songs.find((s) => s.mp3Path === filePath);
    if (match) {
      await db
        .update(songsTable)
        .set({ mp3Path: null })
        .where(eq(songsTable.id, match.id));
      logger.info({ songId: match.id, filePath }, "Music file unlinked from song");
    }
  } catch (err) {
    logger.error({ err, filePath }, "Failed to unlink music file");
  }
}

function startWatcher(folderPath: string): void {
  watcher = chokidar.watch(folderPath, {
    // Ignore hidden files
    ignored: /(^|[/\\])\../,
    persistent: true,
    // Index existing files on startup
    ignoreInitial: false,
  });

  watcher
    .on("add", (fp) => { void indexFile(fp); })
    .on("change", (fp) => { void indexFile(fp); })
    .on("unlink", (fp) => { void unlinkFile(fp); })
    .on("error", (err) => { logger.error({ err }, "Music folder watcher error"); });

  logger.info({ folderPath }, "Music folder watcher started");
}
