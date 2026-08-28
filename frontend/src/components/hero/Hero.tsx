import { motion } from "framer-motion";
import { SwarmField } from "../field/SwarmField";
import { TaskForm } from "./TaskForm";
import { useEffect } from "react";
import type { Run } from "../../lib/types";

export function Hero({
  onSubmit,
  submitting,
  error,
  run,
}: {
  onSubmit: (input: { taskDescription: string; taskType: string; repoRef: string }) => void;
  submitting: boolean;
  error: string | null;
  run?: Run | null;
}) {
  // Auto-scroll when a run starts
  useEffect(() => {
    if (run && run.status !== "complete") {
      const swarmSection = document.getElementById("swarm");
      if (swarmSection) {
        swarmSection.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [run]);

  return (
    <section
      id="run"
      className="relative flex min-h-screen flex-col justify-center overflow-hidden px-6 pb-20 pt-32 sm:px-10"
    >
      <SwarmField
        density={64}
        className="pointer-events-none absolute inset-0 h-full w-full opacity-70"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-[20%] top-[40%] h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 animate-drift rounded-full bg-gold/[0.06] blur-[120px]"
      />
      <div className="relative mx-auto flex w-full max-w-5xl flex-col md:flex-row items-center text-left gap-12">
        <div className="flex-1">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-block mb-5 rounded-full border border-line-strong px-3.5 py-1.5 font-mono text-xs uppercase tracking-[0.14em] text-stone"
          >
            five specialists · one report
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-balance font-display text-4xl font-medium leading-[1.05] tracking-tight text-paper sm:text-6xl"
          >
            Five specialists read your code.
            <br />
            <span className="text-gradient-gold italic">Every finding, a literal quote.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-5 max-w-lg text-balance text-base text-paper-dim sm:text-lg"
          >
            Describe an engineering task in plain language. A debugger, documenter, refactorer,
            onboarding guide, and data-lineage tracer read your repo in parallel and hand back one
            unified report.
          </motion.p>
          {run && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 flex items-center gap-3"
            >
              <button
                onClick={() => navigator.clipboard.writeText(run.id)}
                className="rounded border border-line bg-void px-3 py-1 text-sm font-mono text-gold-soft hover:bg-gold/10"
              >
                Copy Full Run ID
              </button>
              <span className="text-sm text-stone-dim">Use this ID for BobSwarm Orchestrator</span>
            </motion.div>
          )}
        </div>
        <div className="flex-1 w-full max-w-md">
          <TaskForm onSubmit={onSubmit} submitting={submitting} />
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 rounded-lg border border-breaks/30 bg-breaks/10 px-4 py-2 text-sm text-breaks"
            >
              {error}
            </motion.p>
          )}
        </div>
      </div>
    </section>
  );
}
