import { pgTable, text, serial, timestamp, integer, boolean, real } from "drizzle-orm/pg-core";

export const projectionStateTable = pgTable("projection_state", {
  id: serial("id").primaryKey(),
  isActive: boolean("is_active").notNull().default(false),
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
  isAudioPlaying: boolean("is_audio_playing").notNull().default(false),
  audioVolume: real("audio_volume").notNull().default(0.8),
  currentLiturgyId: integer("current_liturgy_id"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ProjectionState = typeof projectionStateTable.$inferSelect;
