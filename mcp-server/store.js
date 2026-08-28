/**
 * BobSwarm — In-Memory Run Store
 * Owner: Lethabo (Backend Engineer)
 *
 * Holds run state, findings, and progress events for the lifetime of the MCP
 * server process. No DB for the 48h build — a hackathon demo run doesn't need
 * to survive a restart, and this keeps setup to zero external services.
 *
 * Also the publish side of the live-events bridge: every write here fans out
 * to any WebSocket clients subscribed via events-server.js, which is what
 * replaces frontend/app.js's simulateSwarm() with real swarm activity.
 */

'use strict';

const crypto = require('crypto');

/** @type {Map<string, Run>} */
const runs = new Map();

/** @type {Map<string, Finding[]>} */
const findingsByRun = new Map();

/** @type {Map<string, Set<import('ws').WebSocket>>} */
const subscribers = new Map();

const VALID_SEVERITIES = new Set(['breaks', 'warns', 'informational']);

function createRun({ taskDescription, taskType, repoRef }) {
  const id = crypto.randomUUID();
  const run = {
    id,
    taskDescription,
    taskType,
    repoRef,
    status: 'pending',
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
  runs.set(id, run);
  findingsByRun.set(id, []);
  return run;
}

function getRun(runId) {
  const run = runs.get(runId);
  if (!run) throw new Error(`unknown run_id: ${runId}`);
  return run;
}

/**
 * All runs, most recent first. Ties (identical createdAt, possible if two
 * runs start in the same millisecond) break on id — determinism per doctrine,
 * not just "probably fine."
 */
function listRuns() {
  return Array.from(runs.values())
    .map((run) => ({
      ...run,
      findingCount: (findingsByRun.get(run.id) || []).length,
      durationMs: run.completedAt
        ? Date.parse(run.completedAt) - Date.parse(run.createdAt)
        : null,
    }))
    .sort((a, b) => {
      const dateCmp = Date.parse(b.createdAt) - Date.parse(a.createdAt);
      return dateCmp !== 0 ? dateCmp : b.id.localeCompare(a.id);
    });
}

function recordProgress(runId, subagentRole, status, detail) {
  const run = getRun(runId);
  if (run.status === 'pending') {
    run.status = 'running';
  }
  const event = {
    type: 'progress',
    runId,
    subagentRole,
    status,
    detail: detail || null,
    at: new Date().toISOString(),
  };
  publish(runId, event);
  return event;
}

/**
 * Records one structured finding. Rejects anything without a literal evidence
 * string — no evidence, no finding, per the extract-don't-infer rule that also
 * governs the subagent persona instructions.
 */
function recordFinding(runId, { subagentRole, targetSymbol, affectedPath, severity, evidence }) {
  getRun(runId); // throws if unknown
  if (!VALID_SEVERITIES.has(severity)) {
    throw new Error(`invalid severity "${severity}" — must be one of: ${[...VALID_SEVERITIES].join(', ')}`);
  }
  if (!evidence || typeof evidence !== 'string' || evidence.trim().length === 0) {
    throw new Error('evidence is required — quote the literal source span, do not paraphrase');
  }
  const finding = {
    id: crypto.randomUUID(),
    runId,
    subagentRole,
    targetSymbol,
    affectedPath,
    severity,
    evidence,
    createdAt: new Date().toISOString(),
  };
  findingsByRun.get(runId).push(finding);
  publish(runId, { type: 'finding', runId, finding, at: finding.createdAt });
  return finding;
}

/**
 * Deterministic aggregation: group by subagentRole, sort each group by
 * (affectedPath, targetSymbol) so report ordering never depends on arrival
 * order or wall-clock timing between subagents.
 */
function finalizeRun(runId) {
  const run = getRun(runId);
  run.status = 'complete';
  run.completedAt = new Date().toISOString();

  const findings = findingsByRun.get(runId) || [];
  const byRole = {};
  for (const f of findings) {
    (byRole[f.subagentRole] ||= []).push(f);
  }
  for (const role of Object.keys(byRole)) {
    byRole[role].sort((a, b) => {
      const pathCmp = a.affectedPath.localeCompare(b.affectedPath);
      return pathCmp !== 0 ? pathCmp : a.targetSymbol.localeCompare(b.targetSymbol);
    });
  }
  const sortedByRole = Object.fromEntries(
    Object.entries(byRole).sort(([a], [b]) => a.localeCompare(b))
  );

  const report = {
    runId,
    generatedAt: run.completedAt,
    summary: buildSummary(findings, Object.keys(sortedByRole)),
    findingsByRole: sortedByRole,
  };
  publish(runId, { type: 'run_complete', runId, report, at: run.completedAt });
  return report;
}

function getReport(runId) {
  return finalizeRunIfNeeded(runId);
}

function finalizeRunIfNeeded(runId) {
  const run = getRun(runId);
  if (run.status !== 'complete') {
    return finalizeRun(runId);
  }
  // Already complete: rebuild the same deterministic shape finalizeRun
  // produces (sorted findings, generated summary) rather than a second,
  // less-complete code path -- a GET here must match the run_complete
  // event's shape exactly, not just approximate it.
  const findings = findingsByRun.get(runId) || [];
  const byRole = {};
  for (const f of findings) {
    (byRole[f.subagentRole] ||= []).push(f);
  }
  for (const role of Object.keys(byRole)) {
    byRole[role].sort((a, b) => {
      const pathCmp = a.affectedPath.localeCompare(b.affectedPath);
      return pathCmp !== 0 ? pathCmp : a.targetSymbol.localeCompare(b.targetSymbol);
    });
  }
  const sortedByRole = Object.fromEntries(
    Object.entries(byRole).sort(([a], [b]) => a.localeCompare(b))
  );
  return {
    runId,
    generatedAt: run.completedAt,
    summary: buildSummary(findings, Object.keys(sortedByRole)),
    findingsByRole: sortedByRole,
  };
}

/**
 * One-line, deterministic summary -- counts only, no LLM involved, so it
 * can't hallucinate and needs no doctrine caveat. Severity order is fixed
 * (breaks, warns, informational) regardless of arrival order.
 */
function buildSummary(findings, roles) {
  const bySeverity = { breaks: 0, warns: 0, informational: 0 };
  for (const f of findings) {
    if (f.severity in bySeverity) bySeverity[f.severity] += 1;
  }
  const roleCount = roles.length;
  const roleWord = roleCount === 1 ? 'specialist' : 'specialists';
  const parts = ['breaks', 'warns', 'informational']
    .filter((sev) => bySeverity[sev] > 0)
    .map((sev) => `${bySeverity[sev]} ${sev}`);
  const severityPart = parts.length > 0 ? ` — ${parts.join(', ')}` : '';
  return `${findings.length} finding${findings.length === 1 ? '' : 's'} across ${roleCount} ${roleWord}${severityPart}`;
}

// ── pub/sub for the WebSocket bridge (events-server.js) ─────────────────────

function subscribe(runId, ws) {
  if (!subscribers.has(runId)) subscribers.set(runId, new Set());
  subscribers.get(runId).add(ws);
}

function unsubscribe(runId, ws) {
  subscribers.get(runId)?.delete(ws);
}

function publish(runId, event) {
  const subs = subscribers.get(runId);
  if (!subs) return;
  const payload = JSON.stringify(event);
  for (const ws of subs) {
    if (ws.readyState === ws.OPEN) ws.send(payload);
  }
}

// ── safety-net timeout: a hung Bob session shouldn't hang the demo ──────────
// If a run has been "running" for longer than TIMEOUT_MS without finalizing,
// force-finalize it with whatever findings exist. A live demo that always
// renders something beats one that can freeze mid-recording.
const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes, tune against fixture repo size

function armTimeout(runId) {
  setTimeout(() => {
    const run = runs.get(runId);
    if (run && run.status === 'running') {
      console.error(`[BobSwarm store] run ${runId} timed out — force-finalizing`);
      finalizeRun(runId);
    }
  }, TIMEOUT_MS).unref();
}

module.exports = {
  createRun,
  getRun,
  listRuns,
  recordProgress,
  recordFinding,
  finalizeRun,
  getReport,
  subscribe,
  unsubscribe,
  armTimeout,
};
