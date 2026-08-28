# BobSwarm — System Architecture

> **Owner:** Sibusiso (Lead / Orchestrator)

---

## High-Level Overview

```
                        ┌─────────────────────────────────┐
                        │        Developer (User)          │
                        │  Plain-language task description │
                        └──────────────┬──────────────────┘
                                       │
                                       ▼
                        ┌─────────────────────────────────┐
                        │     BobSwarm Orchestrator        │
                        │  (Bob Agent mode + system prompt)│
                        │                                 │
                        │  1. Parse request               │
                        │  2. decompose() → sub-tasks     │
                        │  3. spawn_subagent × N          │
                        │  4. Aggregate results           │
                        │  5. Return Unified Report       │
                        └──────┬───────────────────┬──────┘
                               │  parallel         │
               ┌───────────────┼───────────────────┼─────────────┐
               │               │                   │             │
               ▼               ▼                   ▼             ▼
        ┌──────────┐   ┌──────────────┐   ┌────────────┐  ┌────────────┐
        │ Debugger │   │  Documenter  │   │ Onboarding │  │Data Lineage│
        │ Subagent │   │  Subagent    │   │  Subagent  │  │  Subagent  │
        └──────────┘   └──────────────┘   └────────────┘  └────────────┘
               │                                            (sequential
               ▼                                           if needed ↓)
        ┌──────────────────┐
        │  Refactorer      │ ← depends on Debugger findings
        │  Subagent        │
        └──────────────────┘
               │
               ▼ (all results collected)
        ┌──────────────────────────────────┐
        │        Unified Report            │
        │  Executive Summary               │
        │  Per-agent findings              │
        │  Prioritised action list         │
        └──────────────────────────────────┘
                        │
          ┌─────────────┴──────────────┐
          ▼                            ▼
   Frontend Dashboard          MCP Server writes
   (Arisha's UI)                report to disk
                                (Lethabo's tools)
```

---

## Component Breakdown

### Orchestrator Layer (`orchestrator/`)
| File | Purpose |
|---|---|
| `system_prompt.md` | Defines the orchestrator's identity, protocol, and report format |
| `decompose.js` | Keyword-based task decomposition — maps request → agent types + sub-tasks |

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

Transport: MCP stdio (Bob's default).

### Frontend Dashboard (`frontend/`)
A single-page, zero-dependency HTML/CSS/JS dashboard that visualises the swarm in real time.

| File | Purpose |
|---|---|
| `index.html` | Dashboard layout — agent cards, task input, results panel, timeline |
| `style.css` | Dark-theme, bee-amber palette, responsive grid |
| `app.js` | Swarm simulation / live SSE integration, report rendering |

In production: `simulateSwarm()` is replaced by a Server-Sent Events or WebSocket
listener connected to the orchestrator backend.

### Bob Configuration (`.bob/`)
| File | Purpose |
|---|---|
| `custom_modes.yaml` | Registers the "BobSwarm Orchestrator" mode in Bob |
| `skills/bobswarm/SKILL.md` | BobSwarm skill — orchestration instructions Bob loads on demand |

---

## Data Flow

```
User task (text)
    → Orchestrator parses + decomposes
    → MCP server: project_summary + list_project_files (context gathering)
    → Subagents read files via MCP: read_project_file
    → Subagents return findings (text)
    → Orchestrator aggregates findings
    → MCP server: write_swarm_report (persist to disk)
    → Frontend: displays Unified Report
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
3. Add the agent card to `frontend/index.html`
4. Update the aggregation logic in the orchestrator system prompt
