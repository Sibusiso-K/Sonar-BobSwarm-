import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BackendUnreachableError, listRuns } from "../../lib/api";
import type { RunSummary } from "../../lib/types";

const STATUS_META: Record<RunSummary["status"], { dot: string; label: string }> = {
  pending: { dot: "bg-stone-dim", label: "Awaiting Bob" },
  queued: { dot: "bg-stone-dim", label: "Awaiting Bob" },
  running: { dot: "bg-violet animate-pulse-soft", label: "Running" },
  complete: { dot: "bg-gold", label: "Complete" },
  error: { dot: "bg-breaks", label: "Error" },
};

function formatDuration(ms: number | null, status: RunSummary["status"]): string {
  if (ms === null) {
    return status === "pending" || status === "queued" ? "awaiting handoff" : "running…";
  }
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remSeconds}s`;
}

/**
 * Self-contained: fetches its own data and polls independently of the
 * single-run hook (useSwarmRun) — this is history across every run, not
 * just the one currently in flight.
 */
export function RunHistory({ onOpenRun }: { onOpenRun?: (run: RunSummary) => void }) {
  const [runs, setRuns] = useState<RunSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let controller: AbortController | null = null;

    async function fetchRuns() {
      controller?.abort();
      controller = new AbortController();
      try {
        const data = await listRuns(controller.signal);
        if (!cancelled) {
          setRuns(data);
          setError(null);
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        if (!cancelled) {
          setError(
            e instanceof BackendUnreachableError
              ? "Run history is temporarily offline. Start the BobSwarm events server to restore it."
              : e instanceof Error
                ? e.message
                : "Run history is temporarily unavailable."
          );
        }
      }
    }

    fetchRuns();
    const interval = setInterval(fetchRuns, 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
      controller?.abort();
    };
  }, []);

  return (
    <section id="history" className="relative border-t border-line px-6 py-24 sm:px-10">
      <div className="mx-auto max-w-4xl">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-stone">History</p>
        <h2 className="mt-1 font-display text-3xl font-medium text-paper sm:text-4xl">
          Every run so far
        </h2>

        {error ? (
          <div className="glass mt-8 rounded-2xl p-10 text-center text-stone-dim">{error}</div>
        ) : runs === null ? (
          <div className="glass mt-8 rounded-2xl p-10 text-center text-stone-dim">Loading…</div>
        ) : runs.length === 0 ? (
          <div className="glass mt-8 rounded-2xl p-10 text-center text-stone-dim">
            No runs yet — prepare a Bob handoff above and it will appear here.
          </div>
        ) : (
          <div className="glass mt-8 flex flex-col divide-y divide-line rounded-2xl p-2">
            <AnimatePresence initial={false}>
              {runs.map((r) => (
                <motion.button
                  type="button"
                  key={r.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => onOpenRun?.(r)}
                  disabled={!onOpenRun}
                  aria-label={`Open ${r.taskDescription}`}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left hover:bg-white/[0.03] disabled:cursor-default"
                >
                  <span
                    title={STATUS_META[r.status].label}
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_META[r.status].dot}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-paper-dim">{r.taskDescription}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-stone-dim">
                      {STATUS_META[r.status].label} · {r.taskType.replace(/_/g, " ")} · {r.repoRef}
                    </p>
                  </div>
                  <div className="shrink-0 text-right font-mono text-xs text-stone">
                    <p>{r.findingCount} findings</p>
                    <p className="mt-0.5 text-stone-dim">{formatDuration(r.durationMs, r.status)}</p>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
}
