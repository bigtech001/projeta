import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { collectionsTable } from "./collections";

export const songsTable = pgTable("songs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull().default(""),
  lyrics: text("lyrics").notNull().default(""),
  mp3Path: text("mp3_path"),
  key: text("key"),
  bpm: integer("bpm"),
  category: text("category"),
  collectionId: integer("collection_id").references(() => collectionsTable.id, { onDelete: "set null" }),
  coverImage: text("cover_image"),
  isFavorite: boolean("is_favorite").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSongSchema = createInsertSchema(songsTable).omit({ id: true, createdAt: true });
export type InsertSong = z.infer<typeof insertSongSchema>;
export type Song = typeof songsTable.$inferSelect;
