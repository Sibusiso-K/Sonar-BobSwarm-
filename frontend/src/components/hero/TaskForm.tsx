import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Loader2, Terminal, FolderGit2, Sparkles } from "lucide-react";
import type { TaskType } from "../../lib/types";

const TASK_TYPES: { value: TaskType; label: string; hint: string; color: string }[] = [
  { value: "full_audit", label: "Full audit", hint: "every specialist, one pass", color: "#d9a441" },
  { value: "debugger", label: "Debug", hint: "chase a specific failure", color: "#e0654f" },
  { value: "documenter", label: "Document", hint: "explain what's undocumented", color: "#5fa8d9" },
  { value: "refactorer", label: "Refactor", hint: "flag structural debt", color: "#8b7bd8" },
  { value: "onboarding", label: "Onboarding", hint: "map the repo for a newcomer", color: "#4bb894" },
  { value: "data_lineage", label: "Data lineage", hint: "trace where data comes from", color: "#e08a4f" },
];

const GOLDEN_DEMO_INPUT = {
  taskDescription:
    "Audit demo/sample-project end to end. Find defects, document the public API, recommend safe refactoring, trace the data flow, and produce an onboarding guide.",
  taskType: "full_audit" as TaskType,
  repoRef: "demo/sample-project",
};

export function TaskForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (input: { taskDescription: string; taskType: TaskType; repoRef: string }) => void;
  submitting: boolean;
}) {
  const [taskDescription, setTaskDescription] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("full_audit");
  const [repoRef, setRepoRef] = useState("");

  const canSubmit = taskDescription.trim().length > 0 && repoRef.trim().length > 0 && !submitting;

  const panelRef = useRef<HTMLFormElement | null>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(my, [0, 1], [3, -3]), { stiffness: 150, damping: 18 });
  const rotateY = useSpring(useTransform(mx, [0, 1], [-3, 3]), { stiffness: 150, damping: 18 });
  const sheenX = useTransform(mx, [0, 1], ["0%", "100%"]);
  const sheenY = useTransform(my, [0, 1], ["0%", "100%"]);

  const handlePanelMouseMove = (e: React.MouseEvent<HTMLFormElement>) => {
    const rect = panelRef.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - rect.left) / rect.width);
    my.set((e.clientY - rect.top) / rect.height);
  };

  const handlePanelMouseLeave = () => {
    mx.set(0.5);
    my.set(0.5);
  };

  return (
    <motion.form
      ref={panelRef}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        onSubmit({ taskDescription: taskDescription.trim(), taskType, repoRef: repoRef.trim() });
      }}
      onMouseMove={handlePanelMouseMove}
      onMouseLeave={handlePanelMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 1200 }}
      className="glass-strong grain relative w-full overflow-hidden rounded-[28px] p-2"
    >
      <motion.div
        aria-hidden
        style={{
          background: useTransform(
            [sheenX, sheenY],
            ([x, y]) =>
              `radial-gradient(360px circle at ${x} ${y}, rgba(243, 237, 225, 0.08), transparent 65%)`
          ),
        }}
        className="pointer-events-none absolute inset-0 rounded-[28px]"
      />
      <div className="relative rounded-[22px] bg-void-soft/40 p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <label
            htmlFor="taskDescription"
            className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-gold-soft"
          >
            <Terminal className="h-3.5 w-3.5" />
            Describe the task
          </label>
          <button
            type="button"
            onClick={() => {
              setTaskDescription(GOLDEN_DEMO_INPUT.taskDescription);
              setTaskType(GOLDEN_DEMO_INPUT.taskType);
              setRepoRef(GOLDEN_DEMO_INPUT.repoRef);
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-gold-dim/50 bg-gold/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-gold-soft transition-colors hover:border-gold/70 hover:bg-gold/15"
          >
            <Sparkles className="h-3 w-3" />
            Load sample audit
          </button>
        </div>
        <textarea
          id="taskDescription"
          value={taskDescription}
          onChange={(e) => setTaskDescription(e.target.value)}
          placeholder="e.g. Figure out why the checkout webhook silently drops retries above 3 attempts"
          rows={3}
          className="w-full resize-none bg-transparent text-center font-display text-xl leading-snug text-paper placeholder:text-stone-dim focus:outline-none sm:text-2xl"
        />

        <div className="mt-5 flex flex-col gap-4 border-t border-line pt-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1">
            <label
              htmlFor="repoRef"
              className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.14em] text-violet-soft"
            >
              <FolderGit2 className="h-3.5 w-3.5" />
              Repository
            </label>
            <input
              id="repoRef"
              value={repoRef}
              onChange={(e) => setRepoRef(e.target.value)}
              placeholder="org/repo or local path"
              className="w-full rounded-lg border border-line bg-void/40 px-3 py-2 font-mono text-sm text-paper placeholder:text-stone-dim focus:border-violet focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="group flex shrink-0 items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-void transition-all hover:bg-gold-soft disabled:cursor-not-allowed disabled:bg-stone-dim disabled:text-paper-dim"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Dispatching swarm…
              </>
            ) : (
              <>
                Dispatch the swarm
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {TASK_TYPES.map((t) => {
            const selected = taskType === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setTaskType(t.value)}
                title={t.hint}
                className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  color: selected ? t.color : `${t.color}b3`,
                  borderColor: selected ? `${t.color}80` : `${t.color}33`,
                  background: selected ? `${t.color}1A` : `${t.color}0d`,
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
    </motion.form>
  );
}
