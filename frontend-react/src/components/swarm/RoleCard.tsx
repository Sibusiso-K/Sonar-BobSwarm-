import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Bug, BookOpen, Wrench, Compass, GitBranch, Circle, CheckCircle2, XCircle } from "lucide-react";
import type { AgentRole } from "../../lib/types";
import type { RoleState } from "../../hooks/useSwarmRun";

const ROLE_META: Record<AgentRole, { label: string; icon: typeof Bug }> = {
  debugger: { label: "Debugger", icon: Bug },
  documenter: { label: "Documenter", icon: BookOpen },
  refactorer: { label: "Refactorer", icon: Wrench },
  onboarding: { label: "Onboarding", icon: Compass },
  data_lineage: { label: "Data lineage", icon: GitBranch },
};

const STATUS_LABEL: Record<RoleState["status"], string> = {
  waiting: "Waiting",
  started: "Started",
  investigating: "Investigating",
  done: "Done",
  skipped: "Skipped",
  error: "Error",
};

const STATUS_GLOW: Record<RoleState["status"], string> = {
  waiting: "0 0 0 rgba(0,0,0,0)",
  started: "0 0 24px -6px rgba(139, 123, 216, 0.45)",
  investigating: "0 0 32px -4px rgba(139, 123, 216, 0.6)",
  done: "0 0 28px -6px rgba(217, 164, 65, 0.55)",
  skipped: "0 0 0 rgba(0,0,0,0)",
  error: "0 0 28px -6px rgba(224, 101, 79, 0.55)",
};

export function RoleCard({ state }: { state: RoleState }) {
  const meta = ROLE_META[state.role];
  const Icon = meta.icon;
  const active = state.status === "started" || state.status === "investigating";
  const done = state.status === "done";
  const failed = state.status === "error";

  const ref = useRef<HTMLDivElement | null>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(my, [0, 1], [7, -7]), { stiffness: 220, damping: 20 });
  const rotateY = useSpring(useTransform(mx, [0, 1], [-7, 7]), { stiffness: 220, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - rect.left) / rect.width);
    my.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseLeave = () => {
    mx.set(0.5);
    my.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 900, boxShadow: STATUS_GLOW[state.status] }}
      className={`glass relative flex flex-col gap-3 rounded-2xl p-4 transition-[border-color,box-shadow] duration-500 ${
        active ? "border-violet/40" : done ? "border-gold-dim/60" : failed ? "border-breaks/40" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              done
                ? "bg-gold/15 text-gold"
                : failed
                ? "bg-breaks/15 text-breaks"
                : "bg-white/5 text-paper-dim"
            }`}
          >
            <Icon className="h-4 w-4" />
          </span>
          <span className="font-medium text-paper">{meta.label}</span>
        </div>
        {done ? (
          <CheckCircle2 className="h-4 w-4 text-gold" />
        ) : failed ? (
          <XCircle className="h-4 w-4 text-breaks" />
        ) : active ? (
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-violet" />
          </span>
        ) : (
          <Circle className="h-3 w-3 text-stone-dim" />
        )}
      </div>
      <div className="flex items-center justify-between font-mono text-xs">
        <span className={active ? "text-violet-soft" : done ? "text-gold-soft" : "text-stone"}>
          {STATUS_LABEL[state.status]}
        </span>
      </div>
      {state.detail && (
        <p className="line-clamp-2 text-xs leading-relaxed text-paper-dim">{state.detail}</p>
      )}
    </motion.div>
  );
}
