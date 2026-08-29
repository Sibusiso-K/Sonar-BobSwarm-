import { useCallback, useEffect, useRef, useState } from "react";
import { createRun, subscribeToRun, BackendUnreachableError } from "../lib/api";
import type { ConnState, Finding, Report, Run, SwarmEvent, TimelineEntry, AgentRole, TaskType } from "../lib/types";

export type RoleState = {
  role: AgentRole;
  status: "waiting" | "started" | "investigating" | "done" | "skipped" | "error";
  detail?: string;
};

const ALL_ROLES: AgentRole[] = [
  "debugger",
  "documenter",
  "refactorer",
  "onboarding",
  "data_lineage",
];

const LAST_RUN_STORAGE_KEY = "bobswarm:last-run-id";

function readLastRunId(): string | null {
  try {
    return window.localStorage.getItem(LAST_RUN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeLastRunId(runId: string): void {
  try {
    window.localStorage.setItem(LAST_RUN_STORAGE_KEY, runId);
  } catch {
    // Storage can be unavailable in private browsing or restricted embeds.
  }
}

function clearLastRunId(): void {
  try {
    window.localStorage.removeItem(LAST_RUN_STORAGE_KEY);
  } catch {
    // Storage can be unavailable in private browsing or restricted embeds.
  }
}

export function useSwarmRun() {
  const [run, setRun] = useState<Run | null>(null);
  const [roles, setRoles] = useState<Record<string, RoleState>>({});
  const [findings, setFindings] = useState<Finding[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [connState, setConnState] = useState<ConnState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const roleFromProgress = (event: SwarmEvent & { type: "progress" }): RoleState => ({
    role: event.subagentRole,
    status: event.status,
    detail: event.detail,
  });

  const timelineFromEvent = (event: SwarmEvent): Omit<TimelineEntry, "id"> | null => {
    if (event.type === "progress") {
      return {
        at: event.at,
        label: event.subagentRole,
        detail: event.detail ?? event.status,
        tone: event.status === "done" ? "done" : event.status === "error" ? "error" : "active",
      };
    }
    if (event.type === "finding") {
      return {
        at: event.at,
        label: `${event.finding.subagentRole} · finding`,
        detail: event.finding.targetSymbol,
        tone: event.finding.severity === "breaks" ? "error" : "active",
      };
    }
    if (event.type === "run_complete") {
      return {
        at: event.at,
        label: "run complete",
        detail: `${Object.values(event.report.findingsByRole).flat().length} findings`,
        tone: "done",
      };
    }
    if (event.type === "run_error") {
      return {
        at: event.at,
        label: "run error",
        detail: event.error.message,
        tone: "error",
      };
    }
    return null;
  };

  const pushTimeline = useCallback((entry: Omit<TimelineEntry, "id">, id?: string | number) => {
    setTimeline((prev) => {
      const nextId = id === undefined ? `${Date.now()}-${Math.random()}` : String(id);
      if (prev.some((item) => item.id === nextId)) return prev;
      return [...prev, { ...entry, id: nextId }];
    });
  }, []);

  const applyLiveEvent = useCallback(
    (event: SwarmEvent, id?: string | number) => {
      const timelineEntry = timelineFromEvent(event);
      if (timelineEntry) pushTimeline(timelineEntry, id);

      if (event.type === "progress") {
        setRoles((prev) => ({ ...prev, [event.subagentRole]: roleFromProgress(event) }));
      } else if (event.type === "finding") {
        setFindings((prev) => (prev.some((finding) => finding.id === event.finding.id) ? prev : [...prev, event.finding]));
      } else if (event.type === "run_complete") {
        setReport(event.report);
        setRun((prev) => (prev ? { ...prev, status: "complete", completedAt: event.report.generatedAt ?? prev.completedAt } : prev));
        setSubmitting(false);
      } else if (event.type === "run_error") {
        setReport(event.report);
        setRun((prev) => (prev ? { ...prev, status: "error", error: event.error } : prev));
        setError(event.error.message);
        setSubmitting(false);
      }
    },
    [pushTimeline]
  );

  const applySnapshot = useCallback(
    (snapshot: Extract<SwarmEvent, { type: "snapshot" }>) => {
      setRun(snapshot.run);
      setReport(snapshot.report);
      setFindings(Object.values(snapshot.report.findingsByRole).flat());
      setRoles((prev) => {
        const next = { ...prev };
        for (const role of ALL_ROLES) next[role] ??= { role, status: "waiting" };
        for (const event of Object.values(snapshot.progressByRole ?? {})) {
          if (event.type === "progress") next[event.subagentRole] = roleFromProgress(event);
        }
        return next;
      });
      const replayedTimeline = snapshot.events
        .map((event) => {
          const entry = timelineFromEvent(event);
          return entry ? { ...entry, id: String(event.sequence ?? `${event.at}-${event.type}`) } : null;
        })
        .filter((entry): entry is TimelineEntry => entry !== null);
      setTimeline((prev) => {
        if (snapshot.afterSequence === 0) return replayedTimeline;
        const existingIds = new Set(prev.map((entry) => entry.id));
        return [...prev, ...replayedTimeline.filter((entry) => !existingIds.has(entry.id))];
      });
      if (snapshot.run.status === "complete" || snapshot.run.status === "error") {
        setSubmitting(false);
      }
      if (snapshot.run.status === "error" && snapshot.run.error) {
        const message = typeof snapshot.run.error === "string" ? snapshot.run.error : snapshot.run.error.message;
        setError(message);
      }
    },
    []
  );

  const handleEvent = useCallback(
    (event: SwarmEvent) => {
      if (event.type === "snapshot") {
        applySnapshot(event);
        for (const replayedEvent of event.events) applyLiveEvent(replayedEvent, replayedEvent.sequence);
        return;
      }
      applyLiveEvent(event, event.sequence);
    },
    [applyLiveEvent, applySnapshot]
  );

  const connectToRun = useCallback(
    (runId: string) => {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      setConnState("connecting");
      unsubscribeRef.current = subscribeToRun(runId, {
        onOpen: () => setConnState("open"),
        onError: () => setConnState("error"),
        onClose: () => setConnState((prev) => (prev === "open" ? "closed" : prev)),
        onReconnecting: () => setConnState("reconnecting"),
        onGiveUp: () => {
          setConnState("error");
          setError("Lost the connection to the swarm and couldn't reconnect. Try again.");
          setSubmitting(false);
        },
        onEvent: handleEvent,
      });
    },
    [handleEvent]
  );

  const resume = useCallback(
    (runId: string) => {
      if (!runId.trim()) return;
      setError(null);
      setSubmitting(false);
      setFindings([]);
      setReport(null);
      setTimeline([]);
      setRoles(Object.fromEntries(ALL_ROLES.map((r) => [r, { role: r, status: "waiting" as const }])));
      connectToRun(runId.trim());
    },
    [connectToRun]
  );

  const start = useCallback(
    async (input: { taskDescription: string; taskType: TaskType; repoRef: string }) => {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      setError(null);
      setRun(null);
      setFindings([]);
      setReport(null);
      setTimeline([]);
      setSubmitting(true);
      setRoles(
        Object.fromEntries(ALL_ROLES.map((r) => [r, { role: r, status: "waiting" as const }]))
      );

      try {
        const newRun = await createRun(input);
        setRun(newRun);
        writeLastRunId(newRun.id);
        connectToRun(newRun.id);
      } catch (e) {
        if (e instanceof BackendUnreachableError) {
          setError("Can't reach the BobSwarm events server — is it running on :8787?");
        } else {
          setError(e instanceof Error ? e.message : "Failed to start run");
        }
        setConnState("error");
        setSubmitting(false);
      }
    },
    [connectToRun]
  );

  const reset = useCallback(() => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    setRun(null);
    setRoles({});
    setFindings([]);
    setTimeline([]);
    setReport(null);
    setConnState("idle");
    setError(null);
    setSubmitting(false);
    clearLastRunId();
  }, []);

  useEffect(() => {
    const lastRunId = readLastRunId();
    // oxlint-disable-next-line react/set-state-in-effect -- one-time restoration from external localStorage state.
    if (lastRunId) resume(lastRunId);
  }, [resume]);

  useEffect(() => {
    if (run) writeLastRunId(run.id);
  }, [run]);

  useEffect(() => () => unsubscribeRef.current?.(), []);

  return {
    run,
    roles,
    findings,
    timeline,
    report,
    connState,
    error,
    submitting,
    start,
    resume,
    reset,
    ALL_ROLES,
  };
}
