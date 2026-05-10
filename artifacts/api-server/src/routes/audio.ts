import { Router, type IRouter } from "express";
import { stat as fsStat } from "fs/promises";
import { createReadStream } from "fs";
import fsp from "fs/promises";
import path from "path";
import { db, songsTable, musicFilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { setMusicWatchFolder, fullScan, getMusicWatchFolder } from "../lib/music-indexer";

const router: IRouter = Router();

const DEFAULT_MUSICAS_DIR = path.resolve(
  process.cwd(),
  "config",
  "musicas"
);

// ── List all indexed music/lyric files ────────────────────────────────────────
router.get("/audio/files", async (_req, res): Promise<void> => {
  try {
    const rows = await db
      .select({
        id: musicFilesTable.id,
        filePath: musicFilesTable.filePath,
        filename: musicFilesTable.filename,
        type: musicFilesTable.type,
        songId: musicFilesTable.songId,
        sizeBytes: musicFilesTable.sizeBytes,
        lastModified: musicFilesTable.lastModified,
        indexedAt: musicFilesTable.indexedAt,
      })
      .from(musicFilesTable)
      .orderBy(musicFilesTable.filename);

    const formatted = rows.map((r) => ({
      filename: r.filename,
      title: deriveTitleFromFilename(r.filename, r.type as "mp3" | "pb" | "lyrics"),
      path: r.filePath,
      type: r.type,
      songId: r.songId ?? null,
      sizeBytes: r.sizeBytes ?? null,
      lastModified: r.lastModified ?? null,
      indexedAt: r.indexedAt,
    }));

    res.json(formatted);
  } catch {
    res.json([]);
  }
});

// ── Trigger a full recursive scan ─────────────────────────────────────────────
router.post("/audio/scan", async (req, res): Promise<void> => {
  const folder =
    (req.body?.folder as string | undefined) ??
    getMusicWatchFolder() ??
    DEFAULT_MUSICAS_DIR;

  try {
    const result = await fullScan(folder);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Set music watch folder (updates watcher + triggers scan) ──────────────────
router.post("/audio/watch-folder", async (req, res): Promise<void> => {
  const { folder } = req.body as { folder?: string };
  if (!folder || typeof folder !== "string") {
    res.status(400).json({ error: "folder is required" });
    return;
  }
  try {
    await fsp.mkdir(folder, { recursive: true });
    setMusicWatchFolder(folder);
    res.json({ ok: true, folder });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Stream MP3 with Range support (required for HTML5 audio seeking) ──────────
router.get("/audio/stream/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid song ID" });
    return;
  }

  const [song] = await db
    .select({ mp3Path: songsTable.mp3Path })
    .from(songsTable)
    .where(eq(songsTable.id, id));

  if (!song?.mp3Path) {
    res.status(404).json({ error: "No audio file linked to this song" });
    return;
  }

  let stat: Awaited<ReturnType<typeof fsStat>>;
  try {
    stat = await fsStat(song.mp3Path);
  } catch {
    res.status(404).json({ error: "Audio file not found on filesystem" });
    return;
  }

  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
    const start = parseInt(startStr, 10);
    const end = endStr ? parseInt(endStr, 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": "audio/mpeg",
    });

    createReadStream(song.mp3Path, { start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": "audio/mpeg",
      "Accept-Ranges": "bytes",
    });
    createReadStream(song.mp3Path).pipe(res);
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function deriveTitleFromFilename(
  filename: string,
  type: "mp3" | "pb" | "lyrics"
): string {
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

export default router;
