import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { RoleCard } from "./RoleCard";
import { Timeline } from "./Timeline";
import { LivingSwarmField, type SwarmAnchor } from "../field/LivingSwarmField";
import type { RoleState } from "../../hooks/useSwarmRun";
import type { ConnState } from "../../lib/types";
import type { Run, TimelineEntry } from "../../lib/types";

const STATUS_ENERGY: Record<RoleState["status"], { energy: number; intensity: number; color: SwarmAnchor["color"] }> = {
  waiting: { energy: 0.04, intensity: 0.05, color: "stone" },
  started: { energy: 0.32, intensity: 0.55, color: "violet" },
  investigating: { energy: 0.58, intensity: 1, color: "violet" },
  done: { energy: 1, intensity: 0.15, color: "gold" },
  skipped: { energy: 0.04, intensity: 0, color: "stone" },
  error: { energy: 0.45, intensity: 0.65, color: "breaks" },
};

const CONN_LABEL: Record<ConnState, string> = {
  idle: "idle",
  connecting: "connecting",
  open: "live",
  reconnecting: "reconnecting…",
  closed: "closed",
  error: "error",
};

export function SwarmStage({
  run,
  roles,
  timeline,
  connState,
}: {
  run: Run | null;
  roles: Record<string, RoleState>;
  timeline: TimelineEntry[];
  connState: ConnState;
}) {
  const roleList = Object.values(roles);
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [anchors, setAnchors] = useState<SwarmAnchor[]>([]);
  const [copied, setCopied] = useState(false);

  const copyRunId = () => {
    if (!run) return;
    navigator.clipboard
      .writeText(run.id)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {
        // clipboard permissions can silently fail — not worth surfacing an error for this
      });
  };

  const isRunning = roleList.length > 0;
  const anchorKey = roleList.map((r) => `${r.role}:${r.status}`).join("|");

  useLayoutEffect(() => {
    if (!fieldRef.current) return;

    const measure = () => {
      const fieldRect = fieldRef.current?.getBoundingClientRect();
      if (!fieldRect) return;
      const next: SwarmAnchor[] = [];
      roleList.forEach((r) => {
        const el = cardRefs.current.get(r.role);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const meta = STATUS_ENERGY[r.status];
        next.push({
          id: r.role,
          x: rect.left - fieldRect.left + rect.width / 2,
          y: rect.top - fieldRect.top + rect.height / 2,
          energy: meta.energy,
          intensity: meta.intensity,
          color: meta.color,
        });
      });
      setAnchors(next);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(fieldRef.current);
    cardRefs.current.forEach((el) => ro.observe(el));
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorKey]);

  const dotClass = useMemo(() => {
    if (connState === "open") return "bg-gold animate-pulse-soft";
    if (connState === "reconnecting" || connState === "connecting") return "bg-violet animate-pulse-soft";
    if (connState === "error") return "bg-breaks";
    return "bg-stone-dim";
  }, [connState]);

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
              <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
              run {run.id.slice(0, 8)} · {CONN_LABEL[connState]}
              <button
                type="button"
                onClick={copyRunId}
                title="Copy full run ID — useful for the manual runId-bridging step"
                className="ml-1 flex items-center gap-1 rounded-full border border-line-strong px-2 py-0.5 text-[10px] text-stone-dim transition-colors hover:border-gold hover:text-paper"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "copied" : "copy full id"}
              </button>
            </div>
          )}
        </div>

        {roleList.length === 0 ? (
          <div className="glass relative overflow-hidden rounded-2xl p-10 text-center text-stone-dim">
            <LivingSwarmField
              anchors={[]}
              active={false}
              particleCount={70}
              className="pointer-events-none absolute inset-0 h-full w-full opacity-60"
            />
            <span className="relative">
              Waiting on a task — dispatch one above and the specialists will appear here.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
            <div ref={fieldRef} className="relative">
              <LivingSwarmField
                anchors={anchors}
                active={isRunning}
                particleCount={160}
                className="pointer-events-none absolute inset-0 h-full w-full"
              />
              <motion.div layout className="relative grid grid-cols-1 gap-4 sm:grid-cols-2">
                {roleList.map((r) => (
                  <div
                    key={r.role}
                    ref={(el) => {
                      if (el) cardRefs.current.set(r.role, el);
                      else cardRefs.current.delete(r.role);
                    }}
                  >
                    <RoleCard state={r} />
                  </div>
                ))}
              </motion.div>
            </div>
            <div className="lg:h-[420px]">
              <Timeline entries={timeline} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
