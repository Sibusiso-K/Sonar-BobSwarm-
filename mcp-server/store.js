/**
 * BobSwarm — In-Memory Run Store
 *
 * The store owns the run state machine as well as the event replay buffer.
 * Keeping those concerns together makes an event and the state it describes
 * one synchronous operation: reconnecting clients can always recover from the
 * latest snapshot without racing a write.
 */

'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const RUN_STATUSES = Object.freeze({
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETE: 'complete',
  ERROR: 'error',
});

const TERMINAL_STATUSES = new Set([RUN_STATUSES.COMPLETE, RUN_STATUSES.ERROR]);
const VALID_SEVERITIES = new Set(['breaks', 'warns', 'informational']);

const parsedTimeoutMs = Number.parseInt(process.env.BOBSWARM_RUN_TIMEOUT_MS || '', 10);
const DEFAULT_TIMEOUT_MS = Number.isSafeInteger(parsedTimeoutMs) && parsedTimeoutMs > 0
  ? parsedTimeoutMs
  : 5 * 60 * 1000;
const parsedEventLimit = Number.parseInt(process.env.BOBSWARM_EVENT_LOG_LIMIT || '', 10);
const EVENT_LOG_LIMIT = Number.isSafeInteger(parsedEventLimit) && parsedEventLimit > 0
  ? parsedEventLimit
  : 2_000;

// Unset by default: persistence is opt-in only, so nothing about existing
// behavior (including test hermeticity) changes unless this is explicitly set.
const PERSIST_PATH = process.env.BOBSWARM_PERSIST_PATH || null;
const PERSIST_DEBOUNCE_MS = 250;
let persistTimer = null;

/** @type {Map<string, Run>} */
const runs = new Map();
/** @type {Map<string, Finding[]>} */
const findingsByRun = new Map();
/** @type {Map<string, Map<string, object>>} */
const progressByRun = new Map();
/** @type {Map<string, object[]>} */
const eventsByRun = new Map();
/** @type {Map<string, number>} */
const nextSequenceByRun = new Map();
/** @type {Map<string, Set<import('ws').WebSocket>>} */
const subscribers = new Map();
/** @type {Map<string, NodeJS.Timeout>} */
const timeoutHandles = new Map();

class RunStoreError extends Error {
  constructor(message, code, statusCode) {
    super(message);
    this.name = 'RunStoreError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

function storeError(message, code, statusCode) {
  return new RunStoreError(message, code, statusCode);
}

function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function requireRun(runId) {
  const run = runs.get(runId);
  if (!run) {
    throw storeError(`unknown run_id: ${runId}`, 'RUN_NOT_FOUND', 404);
  }
  return run;
}

function requireNonEmptyString(value, field, maxLength) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw storeError(`${field} must be a non-empty string`, 'INVALID_INPUT', 400);
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw storeError(`${field} must be at most ${maxLength} characters`, 'INVALID_INPUT', 400);
  }
  return normalized;
}

function assertWritable(run, operation) {
  if (TERMINAL_STATUSES.has(run.status)) {
    throw storeError(
      `cannot ${operation} after run ${run.id} reached terminal status "${run.status}"`,
      'RUN_TERMINAL',
      409
    );
  }
}

function transitionToRunning(run) {
  if (run.status !== RUN_STATUSES.PENDING) return;
  const now = new Date().toISOString();
  run.status = RUN_STATUSES.RUNNING;
  run.startedAt = now;
  run.updatedAt = now;
}

function clearRunTimeout(runId) {
  const handle = timeoutHandles.get(runId);
  if (handle) clearTimeout(handle);
  timeoutHandles.delete(runId);
}

function createRun(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw storeError('run input must be a JSON object', 'INVALID_INPUT', 400);
  }

  const taskDescription = requireNonEmptyString(input.taskDescription, 'taskDescription', 10_000);
  const taskType = requireNonEmptyString(input.taskType, 'taskType', 64);
  const repoRef = requireNonEmptyString(input.repoRef, 'repoRef', 2_048);
  if (!/^[a-z][a-z0-9_]{0,63}$/.test(taskType)) {
    throw storeError(
      'taskType must be a lowercase identifier containing only letters, numbers, and underscores',
      'INVALID_INPUT',
      400
    );
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const run = {
    id,
    taskDescription,
    taskType,
    repoRef,
    status: RUN_STATUSES.PENDING,
    createdAt: now,
    startedAt: null,
    updatedAt: now,
    completedAt: null,
    error: null,
    diagram: null,
  };

  runs.set(id, run);
  findingsByRun.set(id, []);
  progressByRun.set(id, new Map());
  eventsByRun.set(id, []);
  nextSequenceByRun.set(id, 1);
  armTimeout(id);
  schedulePersistToDisk();
  return clone(run);
}

function getRun(runId) {
  return clone(requireRun(runId));
}

/** All runs, most recent first, with deterministic tie-breaking. */
function listRuns() {
  return Array.from(runs.values())
    .map((run) => ({
      ...clone(run),
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
  const run = requireRun(runId);
  assertWritable(run, 'record progress');

  const normalizedRole = requireNonEmptyString(subagentRole, 'subagentRole', 128);
  if (!['started', 'investigating', 'done'].includes(status)) {
    throw storeError('status must be started, investigating, or done', 'INVALID_INPUT', 400);
  }
  const normalizedDetail = detail == null
    ? null
    : requireNonEmptyString(detail, 'detail', 2_000);

  transitionToRunning(run);
  run.updatedAt = new Date().toISOString();
  const event = publish(runId, {
    type: 'progress',
    runId,
    subagentRole: normalizedRole,
    status,
    detail: normalizedDetail,
    at: run.updatedAt,
  });
  progressByRun.get(runId).set(normalizedRole, event);
  return event;
}

/** Records one evidence-backed, structured finding. */
function recordFinding(runId, input) {
  const run = requireRun(runId);
  assertWritable(run, 'record a finding');
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw storeError('finding input must be an object', 'INVALID_INPUT', 400);
  }

  const subagentRole = requireNonEmptyString(input.subagentRole, 'subagentRole', 128);
  const targetSymbol = requireNonEmptyString(input.targetSymbol, 'targetSymbol', 512);
  const affectedPath = requireNonEmptyString(input.affectedPath, 'affectedPath', 2_048);
  const evidence = requireNonEmptyString(input.evidence, 'evidence', 20_000);
  if (!VALID_SEVERITIES.has(input.severity)) {
    throw storeError(
      `invalid severity "${input.severity}" — must be one of: ${[...VALID_SEVERITIES].join(', ')}`,
      'INVALID_INPUT',
      400
    );
  }

  transitionToRunning(run);
  const now = new Date().toISOString();
  run.updatedAt = now;
  const finding = {
    id: crypto.randomUUID(),
    runId,
    subagentRole,
    targetSymbol,
    affectedPath,
    severity: input.severity,
    evidence,
    createdAt: now,
  };
  findingsByRun.get(runId).push(finding);
  publish(runId, { type: 'finding', runId, finding: clone(finding), at: now });
  return clone(finding);
}

function groupFindings(findings) {
  const byRole = {};
  for (const finding of findings) {
    (byRole[finding.subagentRole] ||= []).push(clone(finding));
  }
  for (const role of Object.keys(byRole)) {
    byRole[role].sort((a, b) => {
      const pathCmp = a.affectedPath.localeCompare(b.affectedPath);
      if (pathCmp !== 0) return pathCmp;
      const symbolCmp = a.targetSymbol.localeCompare(b.targetSymbol);
      return symbolCmp !== 0 ? symbolCmp : a.id.localeCompare(b.id);
    });
  }
  return Object.fromEntries(Object.entries(byRole).sort(([a], [b]) => a.localeCompare(b)));
}

function buildReport(run) {
  const findings = findingsByRun.get(run.id) || [];
  const findingsByRole = groupFindings(findings);
  return {
    runId: run.id,
    status: run.status,
    isFinal: TERMINAL_STATUSES.has(run.status),
    generatedAt: run.completedAt,
    summary: buildSummary(findings, Object.keys(findingsByRole)),
    findingsByRole,
    error: run.error ? clone(run.error) : null,
    diagram: run.diagram ?? null,
  };
}

/**
 * Completes a running run. Repeated finalization is a read: it preserves the
 * original completion timestamp and never emits a second completion event.
 * An optional mermaid `diagram` string may be attached at finalization time —
 * finalize_run is the only tool call in the swarm lifecycle positioned to
 * summarize the whole run, so this is the one place a diagram can be set.
 */
function finalizeRun(runId, options) {
  const run = requireRun(runId);
  if (run.status === RUN_STATUSES.COMPLETE) return buildReport(run);
  if (run.status === RUN_STATUSES.ERROR) {
    throw storeError(`cannot finalize run ${runId} after it failed`, 'RUN_TERMINAL', 409);
  }
  if (run.status !== RUN_STATUSES.RUNNING) {
    throw storeError(
      `cannot finalize run ${runId} while status is "${run.status}"; record progress first`,
      'INVALID_TRANSITION',
      409
    );
  }

  const diagram = options?.diagram == null ? null : requireNonEmptyString(options.diagram, 'diagram', 50_000);
  const now = new Date().toISOString();
  run.status = RUN_STATUSES.COMPLETE;
  run.updatedAt = now;
  run.completedAt = now;
  if (diagram !== null) run.diagram = diagram;
  clearRunTimeout(runId);
  const report = buildReport(run);
  publish(runId, { type: 'run_complete', runId, report: clone(report), at: now });
  return report;
}

/** Marks an active run failed. Used by timeout handling and future adapters. */
function failRun(runId, message, code = 'RUN_FAILED') {
  const run = requireRun(runId);
  if (run.status === RUN_STATUSES.ERROR) return buildReport(run);
  if (run.status === RUN_STATUSES.COMPLETE) {
    throw storeError(`cannot fail run ${runId} after it completed`, 'RUN_TERMINAL', 409);
  }

  const now = new Date().toISOString();
  run.status = RUN_STATUSES.ERROR;
  run.updatedAt = now;
  run.completedAt = now;
  run.error = {
    code,
    message: requireNonEmptyString(message, 'error message', 2_000),
  };
  clearRunTimeout(runId);
  const report = buildReport(run);
  publish(runId, { type: 'run_error', runId, report: clone(report), error: clone(run.error), at: now });
  return report;
}

/** Side-effect-free for pending, running, complete, and failed runs. */
function getReport(runId) {
  return buildReport(requireRun(runId));
}

/** Deterministic summary; no generated or inferred prose. */
function buildSummary(findings, roles) {
  const bySeverity = { breaks: 0, warns: 0, informational: 0 };
  for (const finding of findings) {
    if (finding.severity in bySeverity) bySeverity[finding.severity] += 1;
  }
  const roleCount = roles.length;
  const roleWord = roleCount === 1 ? 'specialist' : 'specialists';
  const parts = ['breaks', 'warns', 'informational']
    .filter((severity) => bySeverity[severity] > 0)
    .map((severity) => `${bySeverity[severity]} ${severity}`);
  const severityPart = parts.length > 0 ? ` — ${parts.join(', ')}` : '';
  return `${findings.length} finding${findings.length === 1 ? '' : 's'} across ${roleCount} ${roleWord}${severityPart}`;
}

// ── persisted pub/sub for WebSocket reconnects ──────────────────────────────

function subscribe(runId, ws) {
  requireRun(runId);
  if (!subscribers.has(runId)) subscribers.set(runId, new Set());
  subscribers.get(runId).add(ws);
}

function unsubscribe(runId, ws) {
  const runSubscribers = subscribers.get(runId);
  runSubscribers?.delete(ws);
  if (runSubscribers?.size === 0) subscribers.delete(runId);
}

function publish(runId, event) {
  requireRun(runId);
  const sequence = nextSequenceByRun.get(runId) || 1;
  nextSequenceByRun.set(runId, sequence + 1);
  const persistedEvent = Object.freeze({ ...clone(event), sequence });
  const eventLog = eventsByRun.get(runId);
  eventLog.push(persistedEvent);
  if (eventLog.length > EVENT_LOG_LIMIT) {
    eventLog.splice(0, eventLog.length - EVENT_LOG_LIMIT);
  }

  const payload = JSON.stringify(persistedEvent);
  for (const ws of subscribers.get(runId) || []) {
    if (ws.readyState !== 1) continue;
    try {
      ws.send(payload);
    } catch {
      unsubscribe(runId, ws);
    }
  }
  schedulePersistToDisk();
  return clone(persistedEvent);
}

function normalizeAfterSequence(afterSequence) {
  if (afterSequence === undefined || afterSequence === null || afterSequence === '') return 0;
  const value = typeof afterSequence === 'number'
    ? afterSequence
    : Number.parseInt(afterSequence, 10);
  if (!Number.isSafeInteger(value) || value < 0 || String(value) !== String(afterSequence)) {
    throw storeError('after must be a non-negative integer', 'INVALID_INPUT', 400);
  }
  return value;
}

/**
 * Authoritative reconnect payload. The report contains all findings even if
 * the bounded event log had to discard events older than the supplied cursor.
 */
function getSnapshot(runId, afterSequence = 0) {
  const run = requireRun(runId);
  const after = normalizeAfterSequence(afterSequence);
  const eventLog = eventsByRun.get(runId) || [];
  const progressByRole = Object.fromEntries(
    Array.from(progressByRun.get(runId)?.entries() || [])
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([role, event]) => [role, clone(event)])
  );
  const firstAvailableSequence = eventLog[0]?.sequence || (nextSequenceByRun.get(runId) || 1);
  const lastSequence = (nextSequenceByRun.get(runId) || 1) - 1;
  return {
    type: 'snapshot',
    runId,
    run: clone(run),
    report: buildReport(run),
    progressByRole,
    events: eventLog.filter((event) => event.sequence > after).map(clone),
    afterSequence: after,
    firstAvailableSequence,
    lastSequence,
    truncated: firstAvailableSequence > 1 && after < firstAvailableSequence - 1,
    at: new Date().toISOString(),
  };
}

// ── optional disk persistence (survives a process restart) ─────────────────
//
// Gated entirely behind BOBSWARM_PERSIST_PATH — unset by default, so this
// section has zero effect (and zero fs calls) unless explicitly opted into.
// It exists to survive a *backend process restart*; reload-within-a-live-
// session already works via the frontend's own localStorage run-id + the
// WebSocket snapshot replay above, and is unaffected by any of this.

function schedulePersistToDisk() {
  if (!PERSIST_PATH) return;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(writePersistedStateSync, PERSIST_DEBOUNCE_MS);
  persistTimer.unref();
}

/** Never throws — a disk hiccup must not take down the process serving Bob's live tool calls. */
function writePersistedStateSync() {
  try {
    const snapshot = {
      version: 1,
      savedAt: new Date().toISOString(),
      runs: Array.from(runs.entries()),
      findingsByRun: Array.from(findingsByRun.entries()),
      progressByRun: Array.from(progressByRun.entries())
        .map(([runId, roleMap]) => [runId, Array.from(roleMap.entries())]),
      eventsByRun: Array.from(eventsByRun.entries()),
      nextSequenceByRun: Array.from(nextSequenceByRun.entries()),
    };
    fs.mkdirSync(path.dirname(PERSIST_PATH), { recursive: true });
    const tmpPath = `${PERSIST_PATH}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(snapshot));
    fs.renameSync(tmpPath, PERSIST_PATH);
  } catch (error) {
    console.error('[BobSwarm store] failed to persist state to disk (will retry on next mutation):', error.message);
  }
}

/**
 * Rehydrates the store from disk on startup. Returns false (not an error) on
 * a fresh install with no file yet, or on a corrupt file — either way the
 * store just starts empty rather than failing to boot.
 */
function loadPersistedStateFromDisk() {
  if (!PERSIST_PATH) return false;
  let raw;
  try {
    raw = fs.readFileSync(PERSIST_PATH, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('[BobSwarm store] could not read persisted state, starting empty:', error.message);
    }
    return false;
  }

  let snapshot;
  try {
    snapshot = JSON.parse(raw);
  } catch (error) {
    console.error('[BobSwarm store] persisted state file is corrupt, starting empty:', error.message);
    return false;
  }

  let restored;
  try {
    if (!snapshot || snapshot.version !== 1) throw new Error('unsupported snapshot version');
    const entryMap = (value, field) => {
      if (!Array.isArray(value)) throw new Error(`${field} must be an entry array`);
      for (const entry of value) {
        if (!Array.isArray(entry) || entry.length !== 2 || typeof entry[0] !== 'string') {
          throw new Error(`${field} contains an invalid entry`);
        }
      }
      return new Map(value);
    };

    const nextRuns = entryMap(snapshot.runs, 'runs');
    const nextFindings = entryMap(snapshot.findingsByRun, 'findingsByRun');
    const progressEntries = entryMap(snapshot.progressByRun, 'progressByRun');
    const nextEvents = entryMap(snapshot.eventsByRun, 'eventsByRun');
    const nextSequences = entryMap(snapshot.nextSequenceByRun, 'nextSequenceByRun');
    const nextProgress = new Map();

    for (const [id, run] of nextRuns) {
      if (!run || run.id !== id || !Object.values(RUN_STATUSES).includes(run.status)) {
        throw new Error(`runs contains an invalid run for ${id}`);
      }
      if (!Array.isArray(nextFindings.get(id))) throw new Error(`missing findings for ${id}`);
      if (!Array.isArray(nextEvents.get(id))) throw new Error(`missing events for ${id}`);
      const sequence = nextSequences.get(id);
      if (!Number.isSafeInteger(sequence) || sequence < 1) {
        throw new Error(`invalid next sequence for ${id}`);
      }
      const roleEntries = progressEntries.get(id);
      if (!Array.isArray(roleEntries)) throw new Error(`missing progress for ${id}`);
      nextProgress.set(id, entryMap(roleEntries, `progressByRun.${id}`));
      if (run.diagram === undefined) run.diagram = null;
    }

    const knownRunIds = new Set(nextRuns.keys());
    for (const map of [nextFindings, progressEntries, nextEvents, nextSequences]) {
      if ([...map.keys()].some((id) => !knownRunIds.has(id))) {
        throw new Error('snapshot contains state for an unknown run');
      }
    }

    restored = {
      runs: nextRuns,
      findings: nextFindings,
      progress: nextProgress,
      events: nextEvents,
      sequences: nextSequences,
    };
  } catch (error) {
    console.error('[BobSwarm store] persisted state is invalid, starting empty:', error.message);
    return false;
  }

  runs.clear();
  findingsByRun.clear();
  progressByRun.clear();
  eventsByRun.clear();
  nextSequenceByRun.clear();
  for (const [id, run] of restored.runs) runs.set(id, run);
  for (const [id, findings] of restored.findings) findingsByRun.set(id, findings);
  for (const [id, roleMap] of restored.progress) progressByRun.set(id, roleMap);
  for (const [id, events] of restored.events) eventsByRun.set(id, events);
  for (const [id, sequence] of restored.sequences) nextSequenceByRun.set(id, sequence);

  let rearmed = 0;
  for (const run of runs.values()) {
    if (!TERMINAL_STATUSES.has(run.status)) {
      armTimeout(run.id);
      rearmed += 1;
    }
  }

  console.error(
    `[BobSwarm store] rehydrated ${runs.size} run(s) from disk` +
    (rearmed > 0 ? ` (${rearmed} in-flight, timeout re-armed)` : '')
  );
  return true;
}

// ── safety-net timeout ──────────────────────────────────────────────────────

function armTimeout(runId, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const run = requireRun(runId);
  if (TERMINAL_STATUSES.has(run.status)) return null;
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
    throw storeError('timeoutMs must be a positive integer', 'INVALID_INPUT', 400);
  }
  clearRunTimeout(runId);
  const handle = setTimeout(() => {
    const current = runs.get(runId);
    if (!current || TERMINAL_STATUSES.has(current.status)) return;
    console.error(`[BobSwarm store] run ${runId} timed out from ${current.status}`);
    failRun(runId, `Run timed out after ${timeoutMs}ms while ${current.status}`, 'RUN_TIMEOUT');
  }, timeoutMs);
  handle.unref();
  timeoutHandles.set(runId, handle);
  return handle;
}

/** Test isolation; intentionally prefixed to discourage production use. */
function __resetForTests() {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = null;
  for (const handle of timeoutHandles.values()) clearTimeout(handle);
  runs.clear();
  findingsByRun.clear();
  progressByRun.clear();
  eventsByRun.clear();
  nextSequenceByRun.clear();
  subscribers.clear();
  timeoutHandles.clear();
}

module.exports = {
  RUN_STATUSES,
  RunStoreError,
  createRun,
  getRun,
  listRuns,
  recordProgress,
  recordFinding,
  finalizeRun,
  failRun,
  getReport,
  getSnapshot,
  subscribe,
  unsubscribe,
  armTimeout,
  loadPersistedStateFromDisk,
  __resetForTests,
};
