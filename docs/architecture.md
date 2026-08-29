# BobSwarm — System Architecture

> **Owner:** Sibusiso (Lead / Orchestrator)

---

## High-Level Overview

BobSwarm has two deliberately separate operator surfaces. The dashboard creates
and observes a run; IBM Bob performs orchestration. The dashboard generates the
exact handoff text needed to bind both surfaces to the same UUID.

```
Dashboard task form
  → POST /runs → pending UUID
  → copy-ready Bob handoff prompt
  → operator pastes prompt into BobSwarm Orchestrator mode
  → decompose(request, contextFiles, taskType) + persona loading
  → first wave: Debugger + Documenter + Onboarding + Data Lineage (parallel)
  → second wave: Refactorer with completed Debugger context (when selected)
  → MCP progress/findings → sequenced event store → WebSocket dashboard
  → finalize_run → deterministic unified report
```

---

## Component Breakdown

### Orchestrator Layer (`orchestrator/`)
| File | Purpose |
|---|---|
| `system_prompt.md` | Defines the orchestrator's identity, protocol, and report format |
| `decompose.js` | Explicit task-type routing with keyword fallback — maps request → agent types + sub-tasks |

The orchestrator uses Bob's native `spawn_subagent` primitive to achieve true parallelism.
No external orchestration framework is needed.

### Agent Personas (`agents/`)
Each agent is defined by a markdown persona file that is injected as the subagent's
system prompt. Personas are deliberately narrow — each agent does exactly one job.

| Agent | File | Dependency |
|---|---|---|
| Debugger | `debugger.md` | None (parallel) |
| Documenter | `documenter.md` | None (parallel) |
| Onboarding | `onboarding.md` | None (parallel) |
| Data Lineage | `data_lineage.md` | None (parallel) |
| Refactorer | `refactorer.md` | After Debugger (sequential) |

### MCP Server (`mcp-server/`)
A lightweight Node.js MCP server exposing filesystem and Git tools to the orchestrator.

| Tool | Description |
|---|---|
| `git_status` | Current repository working tree state |
| `git_log` | Recent commit history |
| `git_diff` | Diff between commits or working tree |
| `git_blame` | Line-level authorship |
| `list_project_files` | Recursive file listing with glob filter |
| `read_project_file` | Read a single file |
| `project_summary` | File counts, sizes, entry points |
| `write_swarm_report` | Persist the final report to disk |
| `record_progress` | Publish an agent lifecycle transition |
| `record_finding` | Store one structured, evidence-bearing finding |
| `finalize_run` | Idempotently complete a running run |
| `get_run_report` | Read a partial/final report without changing state |

Transport: MCP stdio for Bob. The same process starts a loopback HTTP/WebSocket
bridge for the dashboard. Run state is in memory for the proof of concept, but
the event log is sequenced and replayable for reconnecting clients.

### Frontend Dashboard (`frontend/`)
React 19 + TypeScript + Vite, pulled in via `git subtree` from Arisha's own
repo (github.com/Arisha004/frontend) — real code, not a placeholder. See
`frontend/README.md` for its own structure/stack details.

Connects live to the backend's WebSocket events bridge
(`mcp-server/events-server.js`, `ws://127.0.0.1:8787/runs/:id/events` by
default, override with `VITE_BOBSWARM_API`). Each connection receives an
authoritative snapshot before sequenced events. The frontend reconnects with
its last applied sequence, deduplicates replay, restores role state, and shows
terminal errors distinctly. Event contract: `docs/LIVE_EVENTS.md`.

The dashboard does not invoke Bob. After `POST /runs`, it displays a full,
ready-to-paste Bob prompt containing the task, repository reference, task type,
and run UUID. This makes the required operator handoff explicit and prevents
the dashboard and Bob from writing to different runs.

The frontend keeps the latest run ID in browser-local storage and rehydrates it
from the backend's authoritative WebSocket snapshot after a reload. History
rows use the same resume path, so a completed run can be reopened without
creating a duplicate run.

**Pulling Arisha's future updates:**
```bash
git subtree pull --prefix=frontend arisha-frontend main --squash
```
(the `arisha-frontend` remote already points at her repo; add it if missing:
`git remote add arisha-frontend https://github.com/Arisha004/frontend.git`)

### Bob Configuration (`.bob/`)
| File | Purpose |
|---|---|
| `custom_modes.yaml` | Registers the "BobSwarm Orchestrator" mode in Bob |
| `skills/bobswarm/SKILL.md` | BobSwarm skill — orchestration instructions Bob loads on demand |

---

## Data Flow

```
User task in dashboard
    → POST /runs creates pending UUID
    → dashboard builds Bob handoff prompt
    → operator pastes handoff into Bob
    → Orchestrator parses + decompose() routes specialists
    → buildDispatchPayload() adds persona, scope, UUID, lifecycle and evidence rules
    → independent subagents read source and publish progress/findings through MCP
    → dependent Refactorer receives completed Debugger context
    → finalize_run produces the deterministic report
    → HTTP/WebSocket snapshot + sequenced events render in the dashboard
```

---

## Concurrency Model

BobSwarm relies on Bob's built-in `spawn_subagent` parallelism.
All independent agents are dispatched in a **single turn** — they run concurrently
within Bob's execution model.

The only sequential dependency is:
- Refactorer **must** receive Debugger findings first, to avoid proposing changes that conflict with pending bug fixes.

---

## Extensibility

To add a new agent type:
1. Create `agents/<new_agent>.md` with the persona prompt
2. Add the agent to the `KEYWORD_MAP` in `orchestrator/decompose.js`
3. Add the agent's card to `frontend/src/components/swarm/RoleCard.tsx` (and
   the role list in `frontend/src/hooks/useSwarmRun.ts`)
4. Update the aggregation logic in the orchestrator system prompt
