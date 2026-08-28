import { motion } from "framer-motion";
import type { Report, Severity } from "../../lib/types";

const SEVERITY_META: Record<Severity, { label: string; className: string }> = {
  breaks: { label: "Breaks", className: "bg-breaks/15 text-breaks border-breaks/30" },
  warns: { label: "Warns", className: "bg-warns/15 text-warns border-warns/30" },
  informational: { label: "Info", className: "bg-info/15 text-info border-info/30" },
};

export function ReportView({ report }: { report: Report | null }) {
  return (
    <section id="report" className="relative border-t border-line px-6 py-24 sm:px-10">
      <div className="mx-auto max-w-4xl">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-stone">Stage 3</p>
        <h2 className="mt-1 font-display text-3xl font-medium text-paper sm:text-4xl">
          One unified report
        </h2>

        {!report ? (
          <div className="glass mt-8 rounded-2xl p-10 text-center text-stone-dim">
            The report assembles here once every specialist reports back.
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-6">
            {Object.entries(report.findingsByRole).map(([role, findings], i) => (
              <motion.div
                key={role}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="glass rounded-2xl p-5 sm:p-6"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-display text-lg text-paper">{role.replace(/_/g, " ")}</h3>
                  <span className="font-mono text-xs text-stone">{findings.length} findings</span>
                </div>
                <div className="flex flex-col divide-y divide-line">
                  {findings.map((f) => (
                    <div key={f.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${SEVERITY_META[f.severity].className}`}
                        >
                          {SEVERITY_META[f.severity].label}
                        </span>
                        <span className="font-mono text-xs text-paper-dim">{f.affectedPath}</span>
                        <span className="text-xs text-stone-dim">·</span>
                        <span className="font-mono text-xs text-gold-soft">{f.targetSymbol}</span>
                      </div>
                      <p className="text-sm leading-relaxed text-paper-dim">{f.evidence}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
