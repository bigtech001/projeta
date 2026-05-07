import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, songsTable, collectionsTable, liturgiesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/stats/overview", async (_req, res): Promise<void> => {
  const [{ count: totalSongs }] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(songsTable);

  const [{ count: totalCollections }] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(collectionsTable);

  const [{ count: totalLiturgies }] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(liturgiesTable);

  const recentSongs = await db
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
    .orderBy(desc(songsTable.createdAt))
    .limit(5);

  const favoriteSongs = await db
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
    .where(eq(songsTable.isFavorite, true))
    .limit(5);

  const topCollections = await db
    .select({
      id: collectionsTable.id,
      name: collectionsTable.name,
      coverImage: collectionsTable.coverImage,
      songCount: sql<number>`cast(count(${songsTable.id}) as int)`,
      createdAt: collectionsTable.createdAt,
    })
    .from(collectionsTable)
    .leftJoin(songsTable, eq(songsTable.collectionId, collectionsTable.id))
    .groupBy(collectionsTable.id)
    .orderBy(desc(sql`count(${songsTable.id})`))
    .limit(5);

  res.json({
    totalSongs,
    totalCollections,
    totalLiturgies,
    recentSongs,
    favoriteSongs,
    topCollections,
  });
});

export default router;
