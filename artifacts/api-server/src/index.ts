import { createServer } from "http";
import app from "./app";
import { logger } from "./lib/logger";
import { setupWebSocket } from "./lib/websocket";
import { initMusicIndexer } from "./lib/music-indexer";
import { migrateDatabase } from "@workspace/db/migrate";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Ensure SQLite schema is up-to-date before handling any requests
migrateDatabase();

const server = createServer(app);
setupWebSocket(server);

server.listen(port, (err?: Error) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");

  // Start music folder watcher after server is ready
  initMusicIndexer();
});
