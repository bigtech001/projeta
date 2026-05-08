import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const projectionStateTable = sqliteTable("projection_state", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(false),
  mode: text("mode"),
  currentSongId: integer("current_song_id"),
  currentSongTitle: text("current_song_title"),
  currentVerseIndex: integer("current_verse_index"),
  currentVerseLine: text("current_verse_line"),
  nextVerseLine: text("next_verse_line"),
  totalVerses: integer("total_verses"),
  bibleVerse: text("bible_verse"),
  bibleReference: text("bible_reference"),
  announcement: text("announcement"),
  isAudioPlaying: integer("is_audio_playing", { mode: "boolean" }).notNull().default(false),
  audioVolume: real("audio_volume").notNull().default(0.8),
  currentLiturgyId: integer("current_liturgy_id"),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
});

export type ProjectionState = typeof projectionStateTable.$inferSelect;
