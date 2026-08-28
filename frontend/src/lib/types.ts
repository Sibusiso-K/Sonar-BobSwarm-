export type AgentRole =
  | "debugger"
  | "documenter"
  | "refactorer"
  | "onboarding"
  | "data_lineage";

export type TaskType =
  | "full_audit"
  | "debugger"
  | "documenter"
  | "refactorer"
  | "onboarding"
  | "data_lineage";

export type Severity = "breaks" | "warns" | "informational";

export type RunStatus = "queued" | "running" | "complete" | "error";

export type ConnState = "idle" | "connecting" | "open" | "reconnecting" | "closed" | "error";

export interface Run {
  id: string;
  taskDescription: string;
  taskType: TaskType;
  repoRef: string;
  status: RunStatus;
  createdAt: string;
}

export interface Finding {
  id: string;
  subagentRole: AgentRole;
  severity: Severity;
  affectedPath: string;
  targetSymbol: string;
  evidence: string;
}

export interface Report {
  runId: string;
  summary: string;
  findingsByRole: Record<string, Finding[]>;
}

export interface TimelineEntry {
  id: string;
  at: string;
  label: string;
  detail: string;
  tone: "neutral" | "active" | "done" | "error";
}

export type ProgressStatus =
  | "waiting"
  | "started"
  | "investigating"
  | "done"
  | "skipped"
  | "error";

export type SwarmEvent =
  | {
      type: "progress";
      at: string;
      subagentRole: AgentRole;
      status: ProgressStatus;
      detail?: string;
    }
  | {
      type: "finding";
      at: string;
      finding: Finding;
    }
  | {
      type: "run_complete";
      at: string;
      report: Report;
    };
