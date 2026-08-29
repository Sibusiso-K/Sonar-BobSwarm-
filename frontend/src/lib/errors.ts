const GENERIC_SERVER_DETAILS = new Set(["not found", "bad request", "internal server error"]);

/** Convert a backend response body into concise, user-facing copy. */
export function responseErrorMessage(rawBody: string, fallback: string): string {
  const trimmed = rawBody.trim();
  if (!trimmed) return fallback;

  let detail = trimmed;
  try {
    const parsed = JSON.parse(trimmed) as { error?: unknown; message?: unknown };
    if (typeof parsed.error === "string") detail = parsed.error;
    else if (typeof parsed.message === "string") detail = parsed.message;
    else return fallback;
  } catch {
    // Plain-text errors are useful if they are concise and intentional.
  }

  const normalized = detail.trim();
  if (
    !normalized ||
    GENERIC_SERVER_DETAILS.has(normalized.toLowerCase()) ||
    normalized.startsWith("<") ||
    normalized.length > 240
  ) {
    return fallback;
  }
  return normalized;
}
