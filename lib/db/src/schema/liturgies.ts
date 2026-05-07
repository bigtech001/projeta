import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { songsTable } from "./songs";

export const liturgiesTable = pgTable("liturgies", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  serviceDate: text("service_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const liturgyItemsTable = pgTable("liturgy_items", {
  id: serial("id").primaryKey(),
  liturgyId: integer("liturgy_id").notNull().references(() => liturgiesTable.id, { onDelete: "cascade" }),
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
