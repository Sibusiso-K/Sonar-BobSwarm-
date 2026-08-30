import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Clipboard, ExternalLink } from "lucide-react";
import { buildBobHandoffPrompt } from "../../lib/handoff";
import type { Run } from "../../lib/types";

type CopyState = "idle" | "copied" | "error";

export function BobHandoff({ run }: { run: Run }) {
  const [copyResult, setCopyResult] = useState<{ runId: string; state: CopyState } | null>(null);
  const prompt = useMemo(() => buildBobHandoffPrompt(run), [run]);
  const copyState = copyResult?.runId === run.id ? copyResult.state : "idle";

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyResult({ runId: run.id, state: "copied" });
    } catch {
      setCopyResult({ runId: run.id, state: "error" });
    }
  };

  useEffect(() => {
    copyPrompt();
    // Auto-copy once per new run, not on every prompt/copyPrompt identity
    // change (run.id is a stable primitive; run itself gets a new object
    // reference on every status update, which would re-fire this).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run.id]);

  return (
    <div className="glass-strong mt-4 rounded-2xl border-gold-dim/40 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold text-xs font-bold text-void">
          2
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-paper">Send the run to Bob</p>
          <p className="mt-1 text-xs leading-relaxed text-paper-dim">
            The dashboard created run <span className="font-mono text-gold-soft">{run.id}</span> and
            is listening for activity. Copy this prompt into Bob to start the specialists against
            that exact run.
          </p>
        </div>
      </div>

      <textarea
        readOnly
        aria-label="Ready-to-paste Bob handoff prompt"
        value={prompt}
        onFocus={(event) => event.currentTarget.select()}
        rows={8}
        className="mt-3 w-full resize-y rounded-xl border border-line bg-void/70 p-3 font-mono text-[11px] leading-relaxed text-paper-dim focus:border-gold-dim focus:outline-none"
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={copyPrompt}
          className="flex items-center gap-2 rounded-full bg-gold px-4 py-2 text-xs font-semibold text-void transition-colors hover:bg-gold-soft"
        >
          {copyState === "copied" ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}
          {copyState === "copied" ? "Copied — paste into Bob" : "Copy Bob handoff prompt"}
        </button>
        <a
          href="#swarm"
          className="flex items-center gap-1.5 text-xs text-stone transition-colors hover:text-paper"
        >
          Watch the live run <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <div className="mt-2 min-h-4 text-xs text-stone-dim" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.p
            key={copyState}
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {copyState === "error"
              ? "Clipboard access was blocked. Select the prompt above and copy it manually."
              : copyState === "copied"
                ? "Copied automatically — switch to Bob and paste to begin orchestration."
                : "This explicit handoff keeps Bob in control of subagent orchestration."}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
