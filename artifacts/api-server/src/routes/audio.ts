import { Router, type IRouter } from "express";
import fs from "fs/promises";
import path from "path";
import { db, songsTable } from "@workspace/db";
import { like } from "drizzle-orm";

const router: IRouter = Router();

const MUSICAS_DIR = path.resolve(process.cwd(), "config", "musicas");

router.get("/audio/files", async (_req, res): Promise<void> => {
  try {
    await fs.mkdir(MUSICAS_DIR, { recursive: true });
    const entries = await fs.readdir(MUSICAS_DIR, { withFileTypes: true });
    const mp3Files = entries
      .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".mp3"))
      .map((e) => {
        const title = e.name.replace(/\.mp3$/i, "").replace(/[-_]/g, " ");
        return {
          filename: e.name,
          title,
          path: `/config/musicas/${e.name}`,
          songId: null as number | null,
        };
      });

    if (mp3Files.length > 0) {
      const dbSongs = await db.select({ id: songsTable.id, title: songsTable.title }).from(songsTable);
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

router.post("/audio/scan", async (_req, res): Promise<void> => {
  try {
    await fs.mkdir(MUSICAS_DIR, { recursive: true });
    const entries = await fs.readdir(MUSICAS_DIR, { withFileTypes: true });
    const mp3Files = entries.filter(
      (e) => e.isFile() && e.name.toLowerCase().endsWith(".mp3")
    );

    let linked = 0;
    const dbSongs = await db.select({ id: songsTable.id, title: songsTable.title }).from(songsTable);

    for (const entry of mp3Files) {
      const title = entry.name.replace(/\.mp3$/i, "").replace(/[-_]/g, " ");
      const match = dbSongs.find(
        (s) => s.title.toLowerCase() === title.toLowerCase()
      );
      if (match) {
        await db
          .update(songsTable)
          .set({ mp3Path: `/config/musicas/${entry.name}` })
          .where(like(songsTable.title, match.title));
        linked++;
      }
    }

    res.json({ scanned: mp3Files.length, linked });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
