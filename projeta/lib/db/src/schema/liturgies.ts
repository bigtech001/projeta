import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { songsTable } from "./songs";

export const liturgiesTable = sqliteTable("liturgies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  serviceDate: text("service_date"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
});

export const liturgyItemsTable = sqliteTable("liturgy_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  liturgyId: integer("liturgy_id")
    .notNull()
    .references(() => liturgiesTable.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("louvor"),
  title: text("title").notNull(),
  details: text("details"),
  durationMinutes: integer("duration_minutes").notNull().default(5),
  order: integer("order").notNull().default(0),
  songId: integer("song_id").references(() => songsTable.id, { onDelete: "set null" }),
});

export const insertLiturgySchema = createInsertSchema(liturgiesTable).omit({ id: true, createdAt: true });
export const insertLiturgyItemSchema = createInsertSchema(liturgyItemsTable).omit({ id: true });
export type InsertLiturgy = z.infer<typeof insertLiturgySchema>;
export type InsertLiturgyItem = z.infer<typeof insertLiturgyItemSchema>;
export type Liturgy = typeof liturgiesTable.$inferSelect;
export type LiturgyItem = typeof liturgyItemsTable.$inferSelect;
