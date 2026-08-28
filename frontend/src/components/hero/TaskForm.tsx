import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import type { TaskType } from "../../lib/types";

const TASK_TYPES: { value: TaskType; label: string; hint: string }[] = [
  { value: "full_audit", label: "Full audit", hint: "every specialist, one pass" },
  { value: "debugger", label: "Debug", hint: "chase a specific failure" },
  { value: "documenter", label: "Document", hint: "explain what's undocumented" },
  { value: "refactorer", label: "Refactor", hint: "flag structural debt" },
  { value: "onboarding", label: "Onboarding", hint: "map the repo for a newcomer" },
  { value: "data_lineage", label: "Data lineage", hint: "trace where data comes from" },
];

export function TaskForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (input: { taskDescription: string; taskType: string; repoRef: string }) => void;
  submitting: boolean;
}) {
  const [taskDescription, setTaskDescription] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("full_audit");
  const [repoRef, setRepoRef] = useState("");

  const canSubmit = taskDescription.trim().length > 0 && repoRef.trim().length > 0 && !submitting;

  return (
    <motion.form
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        onSubmit({ taskDescription: taskDescription.trim(), taskType, repoRef: repoRef.trim() });
      }}
      className="glass-strong grain w-full rounded-[28px] p-2"
    >
      <div className="rounded-[22px] bg-void-soft/40 p-5 sm:p-6">
        <label
          htmlFor="taskDescription"
          className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-stone"
        >
          Describe the task
        </label>
        <textarea
          id="taskDescription"
          value={taskDescription}
          onChange={(e) => setTaskDescription(e.target.value)}
          placeholder="e.g. Figure out why the checkout webhook silently drops retries above 3 attempts"
          rows={3}
          className="w-full resize-none bg-transparent font-display text-xl leading-snug text-paper placeholder:text-stone-dim focus:outline-none sm:text-2xl"
        />

        <div className="mt-5 flex flex-col gap-4 border-t border-line pt-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1">
            <label
              htmlFor="repoRef"
              className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-stone"
            >
              Repository
            </label>
            <input
              id="repoRef"
              value={repoRef}
              onChange={(e) => setRepoRef(e.target.value)}
              placeholder="org/repo or local path"
              className="w-full rounded-lg border border-line bg-void/40 px-3 py-2 font-mono text-sm text-paper placeholder:text-stone-dim focus:border-gold-dim focus:outline-none"
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

        <div className="mt-5 flex flex-wrap gap-2">
          {TASK_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTaskType(t.value)}
              title={t.hint}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                taskType === t.value
                  ? "border-gold-dim bg-gold/10 text-gold-soft"
                  : "border-line text-paper-dim hover:border-line-strong hover:text-paper"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </motion.form>
  );
}
