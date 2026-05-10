import { DatabaseSync } from "node:sqlite";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const dbPath =
  process.env.DB_PATH ??
  path.resolve(process.cwd(), "data", "churchlive.db");

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

/**
 * Node.js 24 built-in SQLite (no native compilation required).
 * drizzle-orm/sqlite-proxy accepts any async callback — no better-sqlite3 import.
 */
export const sqlite = new DatabaseSync(dbPath);

sqlite.exec("PRAGMA journal_mode = WAL");
sqlite.exec("PRAGMA foreign_keys = ON");
sqlite.exec("PRAGMA synchronous = NORMAL");

/**
 * drizzle-orm/sqlite-proxy async callback.
 * Returns rows as arrays of values — the format drizzle expects internally.
 * node:sqlite returns plain row objects; Object.values() converts them.
 * Column order is stable: SQLite preserves SELECT column order in result objects.
 * Drizzle normalises booleans → 0/1 before passing params, so the cast is safe.
 */
export const db = drizzle(
  async (sql, params, method) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stmt = sqlite.prepare(sql) as any;
    if (method === "run") {
      stmt.run(...params);
      return { rows: [] };
    }
    if (method === "get") {
      const row = stmt.get(...params) as Record<string, unknown> | undefined;
      return { rows: row ? [Object.values(row)] : [] };
    }
    // "all" | "values"
    const rows = stmt.all(...params) as Record<string, unknown>[];
    return { rows: rows.map((r) => Object.values(r)) };
  },
  { schema }
);

export * from "./schema";
