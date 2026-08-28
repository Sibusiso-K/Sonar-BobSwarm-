/**
 * BobSwarm — Swarm Dashboard JS
 * Owner: Arisha (Frontend Engineer)
 *
 * Drives the real-time swarm visualisation.
 *
 * In production: replace simulateSwarm() with real SSE / WebSocket
 * events from the BobSwarm orchestrator backend.
 * For the demo: the simulation mirrors the actual parallel agent lifecycle.
 */

'use strict';

// ── State ─────────────────────────────────────────────────────────────────────

const AGENTS = ['debugger', 'documenter', 'refactorer', 'onboarding', 'data_lineage'];

const state = {
  running: false,
  startTime: null,
  agentStates: {},  // agent → { status, startMs, endMs, findings }
};

// ── DOM helpers ──────────────────────────────────────────────────────────────

function el(id) { return document.getElementById(id); }

function setOrchestratorStatus(status) {
  const dot = document.querySelector('.status-dot');
  const label = el('status-label');
  dot.className = `status-dot status-dot--${status}`;
  label.textContent = { idle: 'Idle', running: 'Running', done: 'Done', error: 'Error' }[status] || status;
}

function setAgentState(agent, status, statusText) {
  const card = el(`agent-${agent}`);
  const bar  = el(`progress-${agent}`);
  const statusEl = card.querySelector('.agent-card__status');

  // Remove all modifier classes
  card.classList.remove('agent-card--running', 'agent-card--done', 'agent-card--error', 'agent-card--skipped');
  if (status !== 'waiting') card.classList.add(`agent-card--${status}`);

  statusEl.textContent = statusText || status;

  // Animate progress bar for running state
  if (status === 'running') {
    let pct = 0;
    const iv = setInterval(() => {
      pct = Math.min(pct + Math.random() * 15, 88);
      bar.style.width = pct + '%';
      if (pct >= 88) clearInterval(iv);
    }, 300);
    card._progressInterval = iv;
  } else if (status === 'done' || status === 'error') {
    if (card._progressInterval) clearInterval(card._progressInterval);
  }
}

function addTimelineEvent(agentName, message, type = 'running') {
  const timeline = el('timeline');
  const empty = timeline.querySelector('.timeline__empty');
  if (empty) empty.remove();

  const now = new Date();
  const elapsed = state.startTime
    ? `+${((now - state.startTime) / 1000).toFixed(1)}s`
    : now.toLocaleTimeString();

  const ev = document.createElement('div');
  ev.className = `timeline-event timeline-event--${type}`;
  ev.innerHTML = `
    <span class="timeline-event__time">${elapsed}</span>
    <span class="timeline-event__label"><strong>${agentName}</strong> — ${message}</span>
  `;
  timeline.appendChild(ev);
  timeline.scrollTop = timeline.scrollHeight;
}

// ── Swarm simulation ─────────────────────────────────────────────────────────
//
// Replace this block with real SSE/WebSocket events in production.
// Each agent runs for a randomised duration to simulate parallel work.

function simulateSwarm(taskText) {
  state.startTime = Date.now();
  state.agentStates = {};

  // Decompose: determine which agents to activate based on task keywords
  const lower = taskText.toLowerCase();
  const active = [];
  if (/bug|error|crash|fix|debug/.test(lower))                       active.push('debugger');
  if (/document|doc|api|comment/.test(lower))                        active.push('documenter');
  if (/refactor|clean|improve|optimise|optimize/.test(lower))        active.push('refactorer');
  if (/onboard|new developer|guide|walkthrough/.test(lower))         active.push('onboarding');
  if (/data|flow|lineage|trace|pipeline/.test(lower))                active.push('data_lineage');
  if (active.length === 0) AGENTS.forEach((a) => active.push(a));   // default: full audit

  // Mark inactive agents
  AGENTS.forEach((a) => {
    if (!active.includes(a)) setAgentState(a, 'skipped', 'Not needed');
  });

  addTimelineEvent('Orchestrator', `Decomposed into ${active.length} sub-tasks`);

  const findings = {};
  let completed = 0;

  const agentLabels = {
    debugger: 'Debugger 🐛',
    documenter: 'Documenter 📝',
    refactorer: 'Refactorer 🔧',
    onboarding: 'Onboarding 🧭',
    data_lineage: 'Data Lineage 🔍',
  };

  // Refactorer depends on debugger — simulate sequential start
  active.forEach((agent) => {
    const isRefactorer = agent === 'refactorer';
    const delay = isRefactorer
      ? 3000 + Math.random() * 1000   // starts after debugger likely done
      : 200 + Math.random() * 500;    // parallel start with small jitter

    const duration = 2500 + Math.random() * 4000;

    setTimeout(() => {
      setAgentState(agent, 'running', 'Analysing…');
      addTimelineEvent(agentLabels[agent], 'Started');

      setTimeout(() => {
        setAgentState(agent, 'done', 'Done');
        findings[agent] = generateDemoFindings(agent);
        addTimelineEvent(agentLabels[agent], `Completed — ${findings[agent].count} findings`, 'done');

        completed++;
        if (completed === active.length) {
          setTimeout(() => finishSwarm(findings, active, taskText), 400);
        }
      }, duration);
    }, delay);
  });
}

function generateDemoFindings(agent) {
  const counts = { debugger: 7, documenter: 15, refactorer: 5, onboarding: 1, data_lineage: 6 };
  return { count: counts[agent] || 3 };
}

function finishSwarm(findings, activeAgents, taskText) {
  setOrchestratorStatus('done');

  const elapsed = ((Date.now() - state.startTime) / 1000).toFixed(1);
  addTimelineEvent('Orchestrator', `Aggregating results from ${activeAgents.length} agents`, 'done');

  const report = buildReport(findings, activeAgents, taskText, elapsed);
  el('report-output').textContent = report;
  el('results-section').style.display = '';
  el('run-btn').disabled = false;
  el('run-btn').textContent = 'Run Again';
  state.running = false;
}

// ── Report builder ────────────────────────────────────────────────────────────

function buildReport(findings, activeAgents, taskText, elapsed) {
  const ts = new Date().toISOString();
  const agentList = activeAgents.join(', ');

  const sections = {
    debugger: `### 🐛 Debugger
7 issues found:
  [CRITICAL] app.py:62 — ZeroDivisionError in calculate_average when scores=[]
  [HIGH]     app.py:46 — process_records mutates caller's input list
  [HIGH]     app.py:57 — enrich_record silently returns None on failure
  [HIGH]     app.py:29,75 — File handles never closed (resource leak)
  [MEDIUM]   app.py:35 — validate_email regex matches empty string
  [MEDIUM]   utils.py:32 — merge_dicts crashes on None input
  [LOW]      utils.py:16 — MD5 used for ID generation (weak hash)`,

    documenter: `### 📝 Documenter
Docstrings added to 15 functions across app.py and utils.py.
Public API reference generated covering all exported functions.
Module overviews written for app.py (data pipeline) and utils.py (shared utilities).`,

    refactorer: `### 🔧 Refactorer
5 improvements recommended:
  [HIGH]   Replace open() with context managers in load_records / save_results
  [HIGH]   Rewrite process_records to avoid mutating input list
  [MEDIUM] enrich_record should raise or log on failure, not return None
  [MEDIUM] Guard calculate_average against empty list
  [LOW]    Replace MD5 with SHA-256 in generate_id`,

    onboarding: `### 🧭 Onboarding Guide
Full getting-started guide produced:
  Prerequisites: Python 3.10+, requests library
  Run: python app.py <input.json> <output.json> <enrich_api_url>
  Architecture: load → validate → enrich (external API) → transform → save
  Key gotchas documented (3 critical ones noted)`,

    data_lineage: `### 🔍 Data Lineage
Complete data flow map produced across 6 steps:
  DS-1: load_records       — File ingress
  T-1:  validate_email     — Filter transform (bug: allows empty emails)
  T-2:  enrich_record      — External API call (silent failure risk)
  T-3:  transform_record   — Normalise + score aggregation
  SK-1: save_results        — File egress (resource leak)
  SK-2: get_results_summary — API response egress
  3 data quality risks flagged.`,
  };

  let report = `# BobSwarm Report
Task:     ${taskText.replace(/\n/g, ' ')}
Agents:   ${agentList}
Duration: ${elapsed}s
Generated: ${ts}

---

## Executive Summary
The BobSwarm swarm dispatched ${activeAgents.length} specialist agents in parallel and completed analysis
in ${elapsed} seconds. The codebase contains 7 confirmed bugs (1 CRITICAL, 3 HIGH), 15 undocumented
public functions, 5 refactoring improvements, and a complete data lineage with 3 quality risks.
Immediate action required: fix the ZeroDivisionError and resource leaks before any production deployment.

---

## Findings by Agent

`;

  for (const agent of activeAgents) {
    if (sections[agent]) report += sections[agent] + '\n\n';
  }

  report += `---

## Prioritised Action List
1. [CRITICAL] Fix ZeroDivisionError in calculate_average (app.py:62)
2. [HIGH]     Close file handles with context managers (app.py:29, 75)
3. [HIGH]     Fix enrich_record None return — handle failures explicitly (app.py:57)
4. [HIGH]     Fix process_records mutation bug (app.py:46)
5. [MEDIUM]   Fix validate_email regex to reject empty strings (app.py:35)
6. [MEDIUM]   Guard merge_dicts against None inputs (utils.py:32)
7. [LOW]      Replace MD5 with SHA-256 (utils.py:16)`;

  return report;
}

// ── Public API ────────────────────────────────────────────────────────────────

function startSwarm() {
  if (state.running) return;
  const taskText = el('task-input').value.trim();
  if (!taskText) {
    el('task-input').focus();
    return;
  }

  state.running = true;
  el('run-btn').disabled = true;
  el('run-btn').textContent = 'Running…';
  el('results-section').style.display = 'none';
  el('timeline').innerHTML = '<div class="timeline__empty">Starting swarm…</div>';
  el('report-output').textContent = '';

  setOrchestratorStatus('running');
  AGENTS.forEach((a) => setAgentState(a, 'waiting', 'Waiting'));

  simulateSwarm(taskText);
}

function copyReport() {
  const text = el('report-output').textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.querySelector('.btn--secondary');
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = 'Copy Report'; }, 2000);
  });
}
