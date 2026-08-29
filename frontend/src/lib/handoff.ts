import type { Run } from "./types";

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
