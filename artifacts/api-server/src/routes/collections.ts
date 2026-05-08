import { Router, type IRouter } from "express";
import { eq, like, sql } from "drizzle-orm";
import { db, collectionsTable, songsTable } from "@workspace/db";
import {
  ListCollectionsQueryParams,
  CreateCollectionBody,
  GetCollectionParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const collectionWithCount = {
  id: collectionsTable.id,
  name: collectionsTable.name,
  coverImage: collectionsTable.coverImage,
  songCount: sql<number>`cast(count(${songsTable.id}) as int)`,
  createdAt: collectionsTable.createdAt,
};

router.get("/collections", async (req, res): Promise<void> => {
  const query = ListCollectionsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { search } = query.data;

  const collections = await db
    .select(collectionWithCount)
    .from(collectionsTable)
    .leftJoin(songsTable, eq(songsTable.collectionId, collectionsTable.id))
    // SQLite LIKE is case-insensitive for ASCII by default
    .where(search ? like(collectionsTable.name, `%${search}%`) : undefined)
    .groupBy(collectionsTable.id);

  res.json(collections);
});

router.post("/collections", async (req, res): Promise<void> => {
  const parsed = CreateCollectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [collection] = await db.insert(collectionsTable).values(parsed.data).returning();

  const [result] = await db
    .select(collectionWithCount)
    .from(collectionsTable)
    .leftJoin(songsTable, eq(songsTable.collectionId, collectionsTable.id))
    .where(eq(collectionsTable.id, collection.id))
    .groupBy(collectionsTable.id);

  res.status(201).json(result);
});

router.get("/collections/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetCollectionParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [collection] = await db
    .select()
    .from(collectionsTable)
    .where(eq(collectionsTable.id, params.data.id));

  if (!collection) {
    res.status(404).json({ error: "Collection not found" });
    return;
  }

  const songs = await db
    .select()
    .from(songsTable)
    .where(eq(songsTable.collectionId, params.data.id));

  res.json({
    ...collection,
    songs: songs.map((s) => ({ ...s, collectionName: collection.name })),
  });
});

export default router;
