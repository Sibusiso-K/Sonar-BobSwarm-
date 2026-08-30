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

/**
 * `pending` is the backend's canonical pre-dispatch state. `queued` remains
 * accepted so the dashboard can still render runs created by older builds.
 */
export type RunStatus = "pending" | "queued" | "running" | "complete" | "error";

export interface RunError {
  code: string;
  message: string;
}

export type ConnState = "idle" | "connecting" | "open" | "reconnecting" | "closed" | "error";

export interface Run {
  id: string;
  taskDescription: string;
  taskType: TaskType;
  repoRef: string;
  status: RunStatus;
  createdAt: string;
  completedAt?: string | null;
  error?: RunError | string | null;
}

/** Shape returned by GET /runs — Run plus history-list-only fields. */
export interface RunSummary extends Run {
  completedAt: string | null;
  findingCount: number;
  /** null while still running; backend computes this once completed. */
  durationMs: number | null;
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
  status?: RunStatus;
  isFinal?: boolean;
  generatedAt?: string | null;
  summary: string;
  findingsByRole: Record<string, Finding[]>;
  error?: RunError | string | null;
  /** Optional mermaid diagram source, set via finalize_run. Shown as raw source, not rendered. */
  diagram?: string | null;
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

type EventMeta = {
  runId?: string;
  sequence?: number;
};

export type LiveSwarmEvent =
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
    }
  | {
      type: "run_error";
      at: string;
      report: Report;
      error: RunError;
    };

export type SequencedSwarmEvent = LiveSwarmEvent & EventMeta;

export interface RunSnapshot {
  run: Run;
  report: Report;
  events: SequencedSwarmEvent[];
  progressByRole?: Record<string, SequencedSwarmEvent>;
  afterSequence: number;
  firstAvailableSequence: number;
  lastSequence: number;
  truncated?: boolean;
}

export type SwarmEvent =
  | SequencedSwarmEvent
  | ({
      type: "snapshot";
      at?: string;
    } & RunSnapshot);
