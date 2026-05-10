import { Router, type IRouter } from "express";
import { stat as fsStat } from "fs/promises";
import { createReadStream } from "fs";
import fsp from "fs/promises";
import path from "path";
import { db, songsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { setMusicWatchFolder } from "../lib/music-indexer";

const router: IRouter = Router();

const DEFAULT_MUSICAS_DIR = path.resolve(process.cwd(), "config", "musicas");

// ── List all MP3 files and their song linkage ─────────────────────────────────
router.get("/audio/files", async (req, res): Promise<void> => {
  const folder = (req.query.folder as string | undefined) ?? DEFAULT_MUSICAS_DIR;
  try {
    await fsp.mkdir(folder, { recursive: true });
    const entries = await fsp.readdir(folder, { withFileTypes: true });
    const mp3Files = entries
      .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".mp3"))
      .map((e) => {
        const title = e.name.replace(/\.mp3$/i, "").replace(/[-_]/g, " ");
        return {
          filename: e.name,
          title,
          path: path.join(folder, e.name),
          songId: null as number | null,
        };
      });

    if (mp3Files.length > 0) {
      const dbSongs = await db
        .select({ id: songsTable.id, title: songsTable.title })
        .from(songsTable);
      for (const file of mp3Files) {
        const match = dbSongs.find(
          (s) => s.title.toLowerCase() === file.title.toLowerCase()
        );
        if (match) file.songId = match.id;
      }
    }

    res.json(mp3Files);
  } catch {
    res.json([]);
  }
});

// ── Scan folder and auto-link MP3s to songs ───────────────────────────────────
router.post("/audio/scan", async (req, res): Promise<void> => {
  const folder = (req.body?.folder as string | undefined) ?? DEFAULT_MUSICAS_DIR;
  try {
    await fsp.mkdir(folder, { recursive: true });
    const entries = await fsp.readdir(folder, { withFileTypes: true });
    const mp3Files = entries.filter(
      (e) => e.isFile() && e.name.toLowerCase().endsWith(".mp3")
    );

    const dbSongs = await db
      .select({ id: songsTable.id, title: songsTable.title })
      .from(songsTable);

    let linked = 0;
    for (const entry of mp3Files) {
      const candidateTitle = entry.name
        .replace(/\.mp3$/i, "")
        .replace(/[-_]/g, " ")
        .trim();
      const match = dbSongs.find(
        (s) => s.title.toLowerCase() === candidateTitle.toLowerCase()
      );
      if (match) {
        await db
          .update(songsTable)
          .set({ mp3Path: path.join(folder, entry.name) })
          .where(eq(songsTable.id, match.id));
        linked++;
      }
    }

    res.json({ scanned: mp3Files.length, linked });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Set music watch folder (updates chokidar watcher) ────────────────────────
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

export default router;
