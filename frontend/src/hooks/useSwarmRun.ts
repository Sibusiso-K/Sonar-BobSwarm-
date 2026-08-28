import { useCallback, useRef, useState } from "react";
import { createRun, subscribeToRun, BackendUnreachableError } from "../lib/api";
import type { ConnState, Finding, Report, Run, SwarmEvent, TimelineEntry, AgentRole } from "../lib/types";

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

  const pushTimeline = useCallback((entry: Omit<TimelineEntry, "id">) => {
    setTimeline((prev) => [...prev, { ...entry, id: `${Date.now()}-${Math.random()}` }]);
  }, []);

  const handleEvent = useCallback(
    (event: SwarmEvent) => {
      if (event.type === "progress") {
        setRoles((prev) => ({
          ...prev,
          [event.subagentRole]: {
            role: event.subagentRole as AgentRole,
            status: event.status,
            detail: event.detail,
          },
        }));
        pushTimeline({
          at: event.at,
          label: event.subagentRole,
          detail: event.detail ?? event.status,
          tone: event.status === "done" ? "done" : "active",
        });
      } else if (event.type === "finding") {
        setFindings((prev) => [...prev, event.finding]);
        pushTimeline({
          at: event.at,
          label: `${event.finding.subagentRole} · finding`,
          detail: event.finding.targetSymbol,
          tone: event.finding.severity === "breaks" ? "error" : "active",
        });
      } else if (event.type === "run_complete") {
        setReport(event.report);
        setRun((prev) => (prev ? { ...prev, status: "complete" } : prev));
        setSubmitting(false);
        pushTimeline({
          at: event.at,
          label: "run complete",
          detail: `${Object.values(event.report.findingsByRole).flat().length} findings`,
          tone: "done",
        });
      }
    },
    [pushTimeline]
  );

  const start = useCallback(
    async (input: { taskDescription: string; taskType: string; repoRef: string }) => {
      setError(null);
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
        setConnState("connecting");

        unsubscribeRef.current?.();
        unsubscribeRef.current = subscribeToRun(newRun.id, {
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
    [handleEvent]
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
  }, []);

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
    reset,
    ALL_ROLES,
  };
}
