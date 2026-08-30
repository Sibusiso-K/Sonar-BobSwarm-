import type { Finding, Run } from "./types";

export function buildBobHandoffPrompt(run: Run): string {
  return [
    "Continue this BobSwarm run using the existing run. Do not create a new run.",
    "",
    `Run ID: ${run.id}`,
    `Repository: ${run.repoRef}`,
    `Task type: ${run.taskType}`,
    `Task: ${run.taskDescription}`,
    "",
    "Use the BobSwarm orchestrator with the existing run ID above. Dispatch the required specialist subagents in parallel, record progress and literal evidence-backed findings against this exact run, and finalize it only after every specialist reports back.",
  ].join("\n");
}

/**
 * A scoped follow-up prompt for one finding, not a new run — always
 * references the real run ID from `run`, never an invented one.
 */
export function buildFindingFollowUpPrompt(run: Run, finding: Finding): string {
  return [
    `Follow up on one finding from BobSwarm run ${run.id} (repository: ${run.repoRef}).`,
    "",
    `Role: ${finding.subagentRole}`,
    `Severity: ${finding.severity}`,
    `File: ${finding.affectedPath}`,
    `Symbol: ${finding.targetSymbol}`,
    "",
    "Evidence originally quoted:",
    finding.evidence,
    "",
    "Propose a safe, minimal fix for this specific finding. Do not call record_finding, record_progress, or finalize_run for this follow-up — it is outside the swarm run lifecycle.",
  ].join("\n");
}
