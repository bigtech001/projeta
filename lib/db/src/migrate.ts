import { sqlite } from "./index";

/**
 * Idempotent schema bootstrap — safe to run on every startup.
 * Uses CREATE TABLE IF NOT EXISTS so it won't touch existing data.
 * Foreign-key constraints are enabled before this runs (see index.ts).
 */
export function migrateDatabase(): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS collections (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      cover_image TEXT,
      created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS songs (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      title         TEXT    NOT NULL,
      author        TEXT    NOT NULL DEFAULT '',
      lyrics        TEXT    NOT NULL DEFAULT '',
      mp3_path      TEXT,
      key           TEXT,
      bpm           INTEGER,
      category      TEXT,
      collection_id INTEGER REFERENCES collections(id) ON DELETE SET NULL,
      cover_image   TEXT,
      is_favorite   INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS liturgies (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      title        TEXT    NOT NULL,
      service_date TEXT,
      created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS liturgy_items (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      liturgy_id       INTEGER NOT NULL REFERENCES liturgies(id) ON DELETE CASCADE,
      type             TEXT    NOT NULL DEFAULT 'louvor',
      title            TEXT    NOT NULL,
      details          TEXT,
      duration_minutes INTEGER NOT NULL DEFAULT 5,
      "order"          INTEGER NOT NULL DEFAULT 0,
      song_id          INTEGER REFERENCES songs(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS projection_state (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      is_active           INTEGER NOT NULL DEFAULT 0,
      mode                TEXT,
      current_song_id     INTEGER,
      current_song_title  TEXT,
      current_verse_index INTEGER,
      current_verse_line  TEXT,
      next_verse_line     TEXT,
      total_verses        INTEGER,
      bible_verse         TEXT,
      bible_reference     TEXT,
      announcement        TEXT,
      is_audio_playing    INTEGER NOT NULL DEFAULT 0,
      audio_volume        REAL    NOT NULL DEFAULT 0.8,
      current_liturgy_id  INTEGER,
      updated_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    INSERT OR IGNORE INTO projection_state (id) VALUES (1);

    CREATE TABLE IF NOT EXISTS music_files (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path     TEXT    NOT NULL UNIQUE,
      filename      TEXT    NOT NULL,
      type          TEXT    NOT NULL DEFAULT 'mp3',
      song_id       INTEGER REFERENCES songs(id) ON DELETE SET NULL,
      size_bytes    INTEGER,
      last_modified TEXT,
      indexed_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE INDEX IF NOT EXISTS idx_music_files_song_id ON music_files(song_id);
    CREATE INDEX IF NOT EXISTS idx_music_files_type    ON music_files(type);
  `);
}
