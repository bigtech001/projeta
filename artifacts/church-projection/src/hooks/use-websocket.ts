import { useEffect, useState, useRef } from "react";
import { ProjectionState } from "@workspace/api-client-react";

export function useWebSocket() {
  const [state, setState] = useState<ProjectionState | null>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      ws.current = new WebSocket(wsUrl);

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "projection_update" && data.data) {
            setState(data.data);
          }
        } catch (e) {
          console.error("Failed to parse websocket message", e);
        }
      };

      ws.current.onclose = () => {
        // Reconnect after 3 seconds
        reconnectTimeout = setTimeout(connect, 3000);
      };
      
      ws.current.onerror = (err) => {
        console.error("WebSocket error:", err);
        ws.current?.close();
      }
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  return state;
}
