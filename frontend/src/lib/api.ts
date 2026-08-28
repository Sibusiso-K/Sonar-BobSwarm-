import type { Run, SwarmEvent } from "./types";

const API_BASE = import.meta.env.VITE_BOBSWARM_API ?? "http://localhost:8787";
const WS_BASE = API_BASE.replace(/^http/, "ws");

export class BackendUnreachableError extends Error {
  constructor(message = "Could not reach the BobSwarm backend") {
    super(message);
    this.name = "BackendUnreachableError";
  }
}

export async function createRun(input: {
  taskDescription: string;
  taskType: string;
  repoRef: string;
}): Promise<Run> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/runs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    throw new BackendUnreachableError();
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Failed to create run (${res.status})`);
  }

  return (await res.json()) as Run;
}

export interface SubscribeHandlers {
  onOpen?: () => void;
  onEvent: (event: SwarmEvent) => void;
  onError?: (err: unknown) => void;
  onClose?: () => void;
}

export function subscribeToRun(runId: string, handlers: SubscribeHandlers): () => void {
  const socket = new WebSocket(`${WS_BASE}/runs/${runId}/events`);

  socket.onopen = () => handlers.onOpen?.();
  socket.onerror = (err) => handlers.onError?.(err);
  socket.onclose = () => handlers.onClose?.();
  socket.onmessage = (msg) => {
    try {
      const parsed = JSON.parse(msg.data) as SwarmEvent;
      handlers.onEvent(parsed);
    } catch {
      // ignore malformed frames
    }
  };

  return () => {
    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
      socket.close();
    }
  };
}
