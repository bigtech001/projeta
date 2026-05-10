import { defineConfig } from "drizzle-kit";
import path from "path";

const dbPath =
  process.env.DB_PATH ??
  path.resolve(process.cwd(), "data", "churchlive.db");

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: dbPath,
  },
});
