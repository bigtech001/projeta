import { Router, type IRouter } from "express";
import { eq, ilike, and, desc } from "drizzle-orm";
import { db, songsTable, collectionsTable } from "@workspace/db";
import {
  ListSongsQueryParams,
  CreateSongBody,
  GetSongParams,
  GetSongResponse,
  UpdateSongParams,
  UpdateSongBody,
  DeleteSongParams,
  GetSongVersesParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function parseSongVerses(lyrics: string) {
  const blocks = lyrics.split(/\n\s*\n/).filter((b) => b.trim());
  return blocks.map((block, i) => {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    const firstLine = lines[0] ?? "";
    const isLabel = /^(verso|estrofe|coro|refrão|bridge|pré-coro|intro|outro)\s*\d*/i.test(firstLine);
    const label = isLabel ? firstLine : `Verso ${i + 1}`;
    const contentLines = isLabel ? lines.slice(1) : lines;
    return { index: i, label, lines: contentLines };
  });
}

router.get("/songs", async (req, res): Promise<void> => {
  const query = ListSongsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { search, collectionId, category } = query.data;

  const conditions = [];
  if (search) conditions.push(ilike(songsTable.title, `%${search}%`));
  if (collectionId) conditions.push(eq(songsTable.collectionId, collectionId));
  if (category) conditions.push(eq(songsTable.category, category));

  const songs = await db
    .select({
      id: songsTable.id,
      title: songsTable.title,
      author: songsTable.author,
      lyrics: songsTable.lyrics,
      mp3Path: songsTable.mp3Path,
      key: songsTable.key,
      bpm: songsTable.bpm,
      category: songsTable.category,
      collectionId: songsTable.collectionId,
      collectionName: collectionsTable.name,
      coverImage: songsTable.coverImage,
      isFavorite: songsTable.isFavorite,
      createdAt: songsTable.createdAt,
    })
    .from(songsTable)
    .leftJoin(collectionsTable, eq(songsTable.collectionId, collectionsTable.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(songsTable.createdAt));

  res.json(songs);
});

router.post("/songs", async (req, res): Promise<void> => {
  const parsed = CreateSongBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [song] = await db.insert(songsTable).values(parsed.data).returning();
  const withCollection = await db
    .select({
      id: songsTable.id,
      title: songsTable.title,
      author: songsTable.author,
      lyrics: songsTable.lyrics,
      mp3Path: songsTable.mp3Path,
      key: songsTable.key,
      bpm: songsTable.bpm,
      category: songsTable.category,
      collectionId: songsTable.collectionId,
      collectionName: collectionsTable.name,
      coverImage: songsTable.coverImage,
      isFavorite: songsTable.isFavorite,
      createdAt: songsTable.createdAt,
    })
    .from(songsTable)
    .leftJoin(collectionsTable, eq(songsTable.collectionId, collectionsTable.id))
    .where(eq(songsTable.id, song.id));

  res.status(201).json(GetSongResponse.parse(withCollection[0]));
});

router.get("/songs/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetSongParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const rows = await db
    .select({
      id: songsTable.id,
      title: songsTable.title,
      author: songsTable.author,
      lyrics: songsTable.lyrics,
      mp3Path: songsTable.mp3Path,
      key: songsTable.key,
      bpm: songsTable.bpm,
      category: songsTable.category,
      collectionId: songsTable.collectionId,
      collectionName: collectionsTable.name,
      coverImage: songsTable.coverImage,
      isFavorite: songsTable.isFavorite,
      createdAt: songsTable.createdAt,
    })
    .from(songsTable)
    .leftJoin(collectionsTable, eq(songsTable.collectionId, collectionsTable.id))
    .where(eq(songsTable.id, params.data.id));

  if (!rows[0]) {
    res.status(404).json({ error: "Song not found" });
    return;
  }

  res.json(GetSongResponse.parse(rows[0]));
});

router.put("/songs/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateSongParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateSongBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(songsTable)
    .set(parsed.data)
    .where(eq(songsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Song not found" });
    return;
  }

  const rows = await db
    .select({
      id: songsTable.id,
      title: songsTable.title,
      author: songsTable.author,
      lyrics: songsTable.lyrics,
      mp3Path: songsTable.mp3Path,
      key: songsTable.key,
      bpm: songsTable.bpm,
      category: songsTable.category,
      collectionId: songsTable.collectionId,
      collectionName: collectionsTable.name,
      coverImage: songsTable.coverImage,
      isFavorite: songsTable.isFavorite,
      createdAt: songsTable.createdAt,
    })
    .from(songsTable)
    .leftJoin(collectionsTable, eq(songsTable.collectionId, collectionsTable.id))
    .where(eq(songsTable.id, params.data.id));

  res.json(GetSongResponse.parse(rows[0]));
});

router.delete("/songs/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteSongParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(songsTable)
    .where(eq(songsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Song not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/songs/:id/verses", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetSongVersesParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [song] = await db.select().from(songsTable).where(eq(songsTable.id, params.data.id));
  if (!song) {
    res.status(404).json({ error: "Song not found" });
    return;
  }

  res.json(parseSongVerses(song.lyrics));
});

export default router;
