import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Check, Clipboard, LayoutGrid } from "lucide-react";
import { ROLE_META } from "../swarm/RoleCard";
import { buildFindingFollowUpPrompt } from "../../lib/handoff";
import type { AgentRole, Finding, Report, Run, Severity } from "../../lib/types";

const ALL_SEVERITIES: Severity[] = ["breaks", "warns", "informational"];

const SEVERITY_META: Record<
  Severity,
  { label: string; badgeClassName: string; cardClassName: string }
> = {
  breaks: {
    label: "Breaks",
    badgeClassName: "bg-breaks/15 text-breaks border-breaks/30",
    // Highest-weight treatment: a left accent border and a touch more padding
    // so a "breaks" finding visually outweighs the others in the list, not
    // just a different pill color.
    cardClassName: "border-l-2 border-l-breaks/60 pl-4 -ml-4 py-4",
  },
  warns: {
    label: "Warns",
    badgeClassName: "bg-warns/15 text-warns border-warns/30",
    cardClassName: "py-3",
  },
  informational: {
    label: "Info",
    badgeClassName: "bg-info/15 text-info border-info/30",
    cardClassName: "py-3",
  },
};

/** Scoped, per-finding follow-up — a third small copy-to-clipboard instance,
 *  deliberately not shared with BobHandoff/SwarmStage's copy handlers. */
function FindingFixButton({ run, finding }: { run: Run; finding: Finding }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard
      .writeText(buildFindingFollowUpPrompt(run, finding))
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {
        // clipboard permissions can silently fail — not worth surfacing an error for this
      });
  };

  return (
    <button
      type="button"
      onClick={copy}
      title="Copy a scoped follow-up prompt for this finding"
      className="flex w-fit items-center gap-1.5 rounded-full border border-line-strong px-2.5 py-1 font-mono text-[10px] text-stone-dim transition-colors hover:border-gold hover:text-paper"
    >
      {copied ? <Check className="h-3 w-3" /> : <Clipboard className="h-3 w-3" />}
      {copied ? "copied" : "ask Bob to fix this"}
    </button>
  );
}

export function ReportView({
  report,
  run,
  selectedRole = null,
  onSelectRole,
}: {
  report: Report | null;
  run?: Run | null;
  selectedRole?: AgentRole | null;
  onSelectRole?: (role: AgentRole | null) => void;
}) {
  const [activeSeverities, setActiveSeverities] = useState<Set<Severity>>(
    () => new Set(ALL_SEVERITIES)
  );
  const toggleSeverity = (severity: Severity) => {
    setActiveSeverities((prev) => {
      const next = new Set(prev);
      if (next.has(severity)) next.delete(severity);
      else next.add(severity);
      return next;
    });
  };

  const totalFindings = report
    ? Object.values(report.findingsByRole).reduce((sum, f) => sum + f.length, 0)
    : 0;

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
        ) : report.status === "error" ? (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass mt-8 flex flex-col items-center gap-3 rounded-2xl border-breaks/30 p-10 text-center"
          >
            <AlertTriangle className="h-8 w-8 text-breaks" />
            <p className="font-display text-xl text-paper">Run stopped before completion</p>
            <p className="max-w-xl text-sm text-stone-dim">
              {typeof report.error === "string" ? report.error : report.error?.message ?? "The swarm reported an unknown error."}
            </p>
          </motion.div>
        ) : report.status !== "complete" && report.isFinal !== true ? (
          <div className="glass mt-8 rounded-2xl p-10 text-center text-stone-dim">
            The report assembles here once every specialist reports back.
          </div>
        ) : totalFindings === 0 ? (
          // Explicit "clean" state — a completed run with nothing to flag is a
          // legitimate, good-looking result, not an empty edge case to hide.
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass mt-8 flex flex-col items-center gap-3 rounded-2xl p-10 text-center"
          >
            <CheckCircle2 className="h-8 w-8 text-gold" />
            <p className="font-display text-xl text-paper">0 findings — clean pass</p>
            <p className="max-w-sm text-sm text-stone-dim">
              All five specialists finished and found nothing to flag in this repo for the given
              task.
            </p>
          </motion.div>
        ) : (
          <div className="mt-8 flex flex-col gap-6 sm:flex-row">
            {/* Role rail — horizontal scrollable chip row below sm:, a fixed
                left rail above it. Only roles with at least one finding
                appear here; a role with zero findings has nothing to filter to. */}
            <div className="flex shrink-0 gap-2 overflow-x-auto pb-1 sm:w-44 sm:flex-col sm:overflow-visible sm:pb-0">
              <button
                type="button"
                onClick={() => onSelectRole?.(null)}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                  selectedRole === null
                    ? "bg-gold/15 text-gold"
                    : "text-stone-dim hover:bg-white/5 hover:text-paper"
                }`}
              >
                <LayoutGrid className="h-4 w-4 shrink-0" />
                <span className="flex-1 whitespace-nowrap">All</span>
                <span className="font-mono text-xs">{totalFindings}</span>
              </button>
              {Object.entries(report.findingsByRole).map(([role, findings]) => {
                const meta = ROLE_META[role as AgentRole];
                const Icon = meta?.icon;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => onSelectRole?.(role as AgentRole)}
                    className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                      selectedRole === role
                        ? "bg-gold/15 text-gold"
                        : "text-stone-dim hover:bg-white/5 hover:text-paper"
                    }`}
                  >
                    {Icon && <Icon className="h-4 w-4 shrink-0" />}
                    <span className="flex-1 whitespace-nowrap">{meta?.label ?? role.replace(/_/g, " ")}</span>
                    <span className="font-mono text-xs">{findings.length}</span>
                  </button>
                );
              })}
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-4 flex flex-wrap gap-2">
                {ALL_SEVERITIES.map((severity) => (
                  <button
                    key={severity}
                    type="button"
                    onClick={() => toggleSeverity(severity)}
                    className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wide transition-opacity ${
                      SEVERITY_META[severity].badgeClassName
                    } ${activeSeverities.has(severity) ? "opacity-100" : "opacity-30"}`}
                  >
                    {SEVERITY_META[severity].label}
                  </button>
                ))}
              </div>

              {report.diagram && (
                <details className="glass mb-4 rounded-2xl p-4">
                  <summary className="cursor-pointer text-sm text-paper-dim">
                    View diagram source
                  </summary>
                  <pre className="mt-3 overflow-x-auto rounded-lg border border-line bg-void-soft/60 px-3 py-2">
                    <code className="font-mono text-xs leading-relaxed text-paper-dim">
                      {report.diagram}
                    </code>
                  </pre>
                </details>
              )}

              {(() => {
                const visibleEntries = Object.entries(report.findingsByRole)
                  .filter(([role]) => selectedRole === null || role === selectedRole)
                  .map(
                    ([role, findings]) =>
                      [role, findings.filter((f) => activeSeverities.has(f.severity))] as const
                  )
                  .filter(([, findings]) => findings.length > 0);

                if (visibleEntries.length === 0) {
                  return (
                    <div className="glass rounded-2xl p-8 text-center text-sm text-stone-dim">
                      No findings match the current role/severity filter.
                    </div>
                  );
                }

                return (
                  <div className="flex flex-col gap-6">
                    {visibleEntries.map(([role, findings], i) => (
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
                          <span className="font-mono text-xs text-stone">
                            {findings.length} findings
                          </span>
                        </div>
                        <div className="flex flex-col divide-y divide-line">
                          {findings.map((f) => (
                            <div
                              key={f.id}
                              className={`flex flex-col gap-2 first:pt-0 last:pb-0 ${SEVERITY_META[f.severity].cardClassName}`}
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${SEVERITY_META[f.severity].badgeClassName}`}
                                >
                                  {SEVERITY_META[f.severity].label}
                                </span>
                                <span className="font-mono text-xs text-paper-dim">
                                  {f.affectedPath}
                                </span>
                                <span className="text-xs text-stone-dim">·</span>
                                <span className="font-mono text-xs text-gold-soft">
                                  {f.targetSymbol}
                                </span>
                              </div>
                              {/* Evidence is literally quoted source code — the whole
                                  differentiator — so it gets a monospace code block
                                  instead of paragraph styling. */}
                              <pre className="overflow-x-auto rounded-lg border border-line bg-void-soft/60 px-3 py-2">
                                <code className="font-mono text-xs leading-relaxed text-paper-dim">
                                  {f.evidence}
                                </code>
                              </pre>
                              {run && <FindingFixButton run={run} finding={f} />}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
