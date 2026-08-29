import type { Run, RunSummary, SwarmEvent } from "./types";
import { responseErrorMessage } from "./errors";

const API_BASE = import.meta.env.VITE_BOBSWARM_API ?? "http://localhost:8787";
const WS_BASE = API_BASE.replace(/^http/, "ws");

export class BackendUnreachableError extends Error {
  constructor(message = "Could not reach the BobSwarm backend") {
    super(message);
    this.name = "BackendUnreachableError";
  }
}

async function responseError(res: Response, fallback: string): Promise<Error> {
  const body = await res.text().catch(() => "");
  return new Error(responseErrorMessage(body, fallback));
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
    throw await responseError(res, `Failed to create run (${res.status})`);
  }

  return (await res.json()) as Run;
}

export async function listRuns(signal?: AbortSignal): Promise<RunSummary[]> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/runs`, { signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new BackendUnreachableError();
  }
  if (!res.ok) {
    throw await responseError(res, `Failed to list runs (${res.status})`);
  }
  return (await res.json()) as RunSummary[];
}

export interface SubscribeHandlers {
  onOpen?: () => void;
  onEvent: (event: SwarmEvent) => void;
  onError?: (err: unknown) => void;
  onClose?: () => void;
  /** Fired when a dropped connection is being retried, with the attempt number (1-based). */
  onReconnecting?: (attempt: number) => void;
  /** Fired once the reconnect budget is exhausted and the socket is being abandoned. */
  onGiveUp?: () => void;
}

const MAX_RECONNECT_ATTEMPTS = 6;
const BASE_RECONNECT_DELAY_MS = 800;

/**
 * Subscribes to a run's live event feed over a real WebSocket connection, with
 * automatic reconnection (capped, exponential backoff + jitter) if the socket
 * drops before the run naturally completes or the caller unsubscribes.
 */
export function subscribeToRun(runId: string, handlers: SubscribeHandlers): () => void {
  let socket: WebSocket | null = null;
  let attempt = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;
  let lastSequence = 0;

  const clearTimer = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const connect = () => {
    if (stopped) return;
    socket = new WebSocket(`${WS_BASE}/runs/${runId}/events?after=${lastSequence}`);

    socket.onopen = () => {
      attempt = 0;
      handlers.onOpen?.();
    };

    socket.onmessage = (msg) => {
      try {
        const parsed = JSON.parse(msg.data) as SwarmEvent;
        if (parsed.type === "snapshot") {
          lastSequence = Math.max(lastSequence, parsed.lastSequence);
        } else if (typeof parsed.sequence === "number") {
          lastSequence = Math.max(lastSequence, parsed.sequence);
        }
        handlers.onEvent(parsed);
        if (parsed.type === "run_complete" ||
            (parsed.type === "snapshot" && (parsed.run.status === "complete" || parsed.run.status === "error"))) {
          // The run finished cleanly — no need to keep the socket, and no
          // need to reconnect if the server closes it right after.
          stopped = true;
        }
      } catch {
        // ignore malformed frames
      }
    };

    socket.onerror = (err) => {
      handlers.onError?.(err);
    };

    socket.onclose = () => {
      handlers.onClose?.();
      if (stopped) return;

      if (attempt >= MAX_RECONNECT_ATTEMPTS) {
        handlers.onGiveUp?.();
        return;
      }

      attempt += 1;
      handlers.onReconnecting?.(attempt);
      const backoff = BASE_RECONNECT_DELAY_MS * 2 ** (attempt - 1);
      const jitter = Math.random() * 300;
      clearTimer();
      reconnectTimer = setTimeout(connect, backoff + jitter);
    };
  };

  connect();

  return () => {
    stopped = true;
    clearTimer();
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      socket.close();
    }
  };
}
