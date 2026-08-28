import { useEffect, useState } from "react";

/**
 * Ticks once a second while `active` is true, returning elapsed ms since
 * `startIso`. Stops ticking (freezes at the last value) once active goes
 * false — the caller passes the run's actual final duration at that point
 * instead, so this hook only owns the "still running" case.
 */
export function useElapsedTime(startIso: string | null, active: boolean): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active || !startIso) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [active, startIso]);

  if (!startIso) return 0;
  return Math.max(0, now - Date.parse(startIso));
}
