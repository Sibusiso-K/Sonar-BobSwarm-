import type { LiveSwarmEvent, RunError, RunStatus } from "./types";

export function terminalEventStatus(event: LiveSwarmEvent): Extract<RunStatus, "complete" | "error"> | null {
  if (event.type === "run_complete") return "complete";
  if (event.type === "run_error") return "error";
  return null;
}

export function runErrorMessage(
  error: RunError | string | null | undefined,
  fallback = "Bob stopped this run before it completed."
): string {
  if (typeof error === "string" && error.trim()) return error;
  if (error !== null && typeof error === "object" && error.message.trim()) return error.message;
  return fallback;
}
