import { motion } from "framer-motion";
import { RoleCard } from "./RoleCard";
import { Timeline } from "./Timeline";
import type { RoleState } from "../../hooks/useSwarmRun";
import type { Run, TimelineEntry } from "../../lib/types";

export function SwarmStage({
  run,
  roles,
  timeline,
  connState,
}: {
  run: Run | null;
  roles: Record<string, RoleState>;
  timeline: TimelineEntry[];
  connState: "idle" | "connecting" | "open" | "closed" | "error";
}) {
  const roleList = Object.values(roles);

  return (
    <section id="swarm" className="relative border-t border-line px-6 py-24 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-stone">Stage 2</p>
            <h2 className="mt-1 font-display text-3xl font-medium text-paper sm:text-4xl">
              The swarm, working
            </h2>
          </div>
          {run && (
            <div className="flex items-center gap-2 font-mono text-xs text-stone">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  connState === "open"
                    ? "bg-gold animate-pulse-soft"
                    : connState === "error"
                    ? "bg-breaks"
                    : "bg-stone-dim"
                }`}
              />
              run {run.id.slice(0, 8)} · {connState}
            </div>
          )}
        </div>

        {roleList.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center text-stone-dim">
            Waiting on a task — dispatch one above and the specialists will appear here.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
            <motion.div layout className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {roleList.map((r) => (
                <RoleCard key={r.role} state={r} />
              ))}
            </motion.div>
            <div className="lg:h-[420px]">
              <Timeline entries={timeline} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
