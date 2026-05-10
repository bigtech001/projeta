import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, liturgiesTable, liturgyItemsTable } from "@workspace/db";
import {
  CreateLiturgyBody,
  GetLiturgyParams,
  UpdateLiturgyParams,
  UpdateLiturgyBody,
  DeleteLiturgyParams,
  AddLiturgyItemParams,
  AddLiturgyItemBody,
  UpdateLiturgyItemParams,
  UpdateLiturgyItemBody,
  DeleteLiturgyItemParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function getLiturgyWithItems(liturgyId: number) {
  const [liturgy] = await db.select().from(liturgiesTable).where(eq(liturgiesTable.id, liturgyId));
  if (!liturgy) return null;

  const items = await db
    .select()
    .from(liturgyItemsTable)
    .where(eq(liturgyItemsTable.liturgyId, liturgyId))
    .orderBy(liturgyItemsTable.order);

  const totalDurationMinutes = items.reduce((sum, item) => sum + item.durationMinutes, 0);

  return { ...liturgy, items, totalDurationMinutes };
}

router.get("/liturgies", async (_req, res): Promise<void> => {
  const liturgies = await db
    .select({
      id: liturgiesTable.id,
      title: liturgiesTable.title,
      serviceDate: liturgiesTable.serviceDate,
      totalDurationMinutes: sql<number>`cast(coalesce(sum(${liturgyItemsTable.durationMinutes}), 0) as int)`,
      itemCount: sql<number>`cast(count(${liturgyItemsTable.id}) as int)`,
      createdAt: liturgiesTable.createdAt,
    })
    .from(liturgiesTable)
    .leftJoin(liturgyItemsTable, eq(liturgyItemsTable.liturgyId, liturgiesTable.id))
    .groupBy(liturgiesTable.id)
    .orderBy(liturgiesTable.createdAt);

  res.json(liturgies);
});

router.post("/liturgies", async (req, res): Promise<void> => {
  const parsed = CreateLiturgyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [liturgy] = await db.insert(liturgiesTable).values(parsed.data).returning();

  res.status(201).json({
    ...liturgy,
    totalDurationMinutes: 0,
    itemCount: 0,
  });
});

router.get("/liturgies/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetLiturgyParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const result = await getLiturgyWithItems(params.data.id);
  if (!result) {
    res.status(404).json({ error: "Liturgy not found" });
    return;
  }

  res.json(result);
});

router.put("/liturgies/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateLiturgyParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateLiturgyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { items, ...liturgyData } = parsed.data;

  if (Object.keys(liturgyData).length > 0) {
    await db.update(liturgiesTable).set(liturgyData).where(eq(liturgiesTable.id, params.data.id));
  }

  if (items) {
    await db.delete(liturgyItemsTable).where(eq(liturgyItemsTable.liturgyId, params.data.id));
    if (items.length > 0) {
      await db.insert(liturgyItemsTable).values(
        items.map((item) => ({ ...item, liturgyId: params.data.id }))
      );
    }
  }

  const result = await getLiturgyWithItems(params.data.id);
  if (!result) {
    res.status(404).json({ error: "Liturgy not found" });
    return;
  }

  res.json(result);
});

router.delete("/liturgies/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteLiturgyParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(liturgiesTable)
    .where(eq(liturgiesTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Liturgy not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/liturgies/:id/items", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = AddLiturgyItemParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AddLiturgyItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [item] = await db
    .insert(liturgyItemsTable)
    .values({ ...parsed.data, liturgyId: params.data.id })
    .returning();

  res.status(201).json(item);
});

router.put("/liturgy-items/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateLiturgyItemParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateLiturgyItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [item] = await db
    .update(liturgyItemsTable)
    .set(parsed.data)
    .where(eq(liturgyItemsTable.id, params.data.id))
    .returning();

  if (!item) {
    res.status(404).json({ error: "Liturgy item not found" });
    return;
  }

  res.json(item);
});

router.delete("/liturgy-items/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteLiturgyItemParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(liturgyItemsTable)
    .where(eq(liturgyItemsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Item not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
