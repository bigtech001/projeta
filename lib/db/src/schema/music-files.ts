import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { songsTable } from "./songs";

/**
 * Tracks every music/lyric file discovered during recursive folder scans.
 * type: 'mp3'    — standard playback file
 *       'pb'     — playback-only file (filename ends with "- PB.mp3")
 *       'lyrics' — plain-text lyric file (.txt)
 */
export const musicFilesTable = sqliteTable("music_files", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  filePath: text("file_path").notNull().unique(),
  filename: text("filename").notNull(),
  type: text("type").notNull().default("mp3"),
  songId: integer("song_id").references(() => songsTable.id, {
    onDelete: "set null",
  }),
  sizeBytes: integer("size_bytes"),
  lastModified: text("last_modified"),
  indexedAt: text("indexed_at")
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
});

export type MusicFile = typeof musicFilesTable.$inferSelect;
