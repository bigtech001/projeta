import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage } from "http";
import type { Server } from "http";
import { logger } from "./logger";

let wss: WebSocketServer | null = null;

export function setupWebSocket(server: Server) {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: WebSocket, _req: IncomingMessage) => {
    logger.info("WebSocket client connected");

    ws.on("error", (err) => {
      logger.error({ err }, "WebSocket error");
    });

    ws.on("close", () => {
      logger.info("WebSocket client disconnected");
    });

    ws.send(JSON.stringify({ type: "connected", message: "Connected to ChurchLive" }));
  });

  logger.info("WebSocket server ready at /ws");
}

/** Broadcast any typed message to all connected clients. */
export function broadcast(payload: { type: string; data?: unknown }) {
  if (!wss) return;
  const message = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

/** Broadcast a full projection state update. */
export function broadcastProjectionUpdate(state: object) {
  broadcast({ type: "projection_update", data: state });
}
