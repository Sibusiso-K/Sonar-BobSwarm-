import { AnimatePresence, motion } from "framer-motion";
import type { TimelineEntry } from "../../lib/types";

const TONE_DOT: Record<TimelineEntry["tone"], string> = {
  neutral: "bg-stone-dim",
  active: "bg-violet",
  done: "bg-gold",
  error: "bg-breaks",
};

export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  const recent = entries.slice(-12).reverse();

  if (recent.length === 0) {
    return (
      <div className="glass flex h-full min-h-[220px] flex-col items-center justify-center rounded-2xl p-6 text-center">
        <p className="font-mono text-xs text-stone">no activity yet</p>
        <p className="mt-1 text-sm text-stone-dim">
          Send the handoff prompt to Bob to see the specialists work in real time.
        </p>
      </div>
    );
  }

  return (
    <div className="glass flex h-full flex-col rounded-2xl p-4">
      <p className="mb-3 px-1 font-mono text-xs uppercase tracking-[0.14em] text-stone">
        Live feed
      </p>
      <div className="flex flex-col gap-1 overflow-y-auto">
        <AnimatePresence initial={false}>
          {recent.map((e) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-start gap-2.5 rounded-lg px-2 py-1.5 hover:bg-white/[0.03]"
            >
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${TONE_DOT[e.tone]}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-xs text-paper-dim">
                  <span className="text-paper">{e.label}</span> — {e.detail}
                </p>
              </div>
              <span className="shrink-0 font-mono text-[10px] text-stone-dim">
                {new Date(e.at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
