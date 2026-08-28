# 🐝 BobSwarm — On-Demand Multi-Agent Orchestrator

> **IBM Bob 2.0 Hackathon Project**
> Transform any complex engineering task into a coordinated swarm of specialist agents — and get a unified answer in minutes.

---

## What is BobSwarm?

BobSwarm is an on-demand, multi-agent orchestrator built on IBM Bob 2.0. A developer describes any complex engineering task in plain language; BobSwarm automatically decomposes it, spawns a swarm of specialised subagents that work **in parallel**, and aggregates their findings into a single structured report.

It directly solves the hackathon mandate: replacing time-consuming manual investigations with automated, parallel AI collaboration.

---

## Team

| Role | Member | Key Focus |
|---|---|---|
| **Lead / Orchestrator** | Sibusiso | Master system prompt, end-to-end flow, Agent mode configuration |
| **Backend Engineer** | Lethabo | File system ops, Git integration, MCP server, background tasks |
| **Frontend Engineer** | Arisha | Web UI, real-time swarm visualisation, result display |
| **Data / QA Engineer** | Mmopiemang | Sample projects, test datasets, validation, demo script, Bobalytics |
| **AI/ML Engineer** | Farheen | Subagent persona design, prompt engineering, task decomposition logic |

---

## Repository Structure

```
BobSwarm/
├── .bob/
│   ├── custom_modes.yaml          # Bob mode: BobSwarm Orchestrator
│   └── skills/
│       └── bobswarm/
│           └── SKILL.md           # BobSwarm orchestration skill
│
├── orchestrator/
│   ├── system_prompt.md           # Master orchestrator system prompt (Sibusiso)
│   └── decompose.js               # Task decomposition logic (Farheen)
│
├── agents/
│   ├── debugger.md                # Debugger subagent persona (Farheen)
│   ├── documenter.md              # Documenter subagent persona (Farheen)
│   ├── refactorer.md              # Refactorer subagent persona (Farheen)
│   ├── onboarding.md              # Onboarding subagent persona (Farheen)
│   └── data_lineage.md            # Data Lineage subagent persona (Farheen)
│
├── mcp-server/
│   ├── package.json               # MCP server package (Lethabo)
│   ├── server.js                  # MCP server entry point (Lethabo)
│   └── tools/
│       ├── git.js                 # Git integration tools (Lethabo)
│       └── filesystem.js          # File system tools (Lethabo)
│
├── frontend/                       # React + TypeScript + Vite (Arisha)
│   ├── src/components/             # Nav, Hero/TaskForm, SwarmStage/RoleCard, ReportView
│   ├── src/hooks/useSwarmRun.ts    # Run lifecycle: dispatch, WS subscribe, live state
│   └── src/lib/                    # api.ts (REST/WS client), types.ts (shared contract)
│
├── demo/
│   ├── sample-project/            # Sample broken codebase for demo (Mmpoiemang)
│   │   ├── app.py
│   │   └── utils.py
│   ├── run_demo.sh                # Demo script (Mmpoiemang)
│   └── expected_output.md        # Expected swarm output for validation (Mmpoiemang)
│
└── docs/
    ├── architecture.md            # System architecture
    ├── agent_personas.md          # All agent persona specs
    └── CONTRIBUTING.md            # Team contribution guide
```

---

## How It Works

```
User Request (plain language)
        │
        ▼
┌─────────────────────┐
│  BobSwarm Agent     │  ← Bob Agent mode + master system prompt
│  (Orchestrator)     │
└────────┬────────────┘
         │  spawn_subagent × N (parallel)
    ┌────┴──────────────────────────────┐
    │           │           │           │
    ▼           ▼           ▼           ▼
 Debugger  Documenter  Refactorer  Data Lineage
 Subagent   Subagent    Subagent    Subagent
    │           │           │           │
    └────┬──────────────────────────────┘
         │  aggregate results
         ▼
  Structured Unified Report
```

---

## Supported Task Types

| Task | Subagents Spawned |
|---|---|
| **Debug a codebase** | Debugger, Data Lineage |
| **Document a project** | Documenter, Onboarding |
| **Refactor legacy code** | Refactorer, Debugger |
| **Onboard a new developer** | Onboarding, Documenter |
| **Trace data flow / lineage** | Data Lineage, Documenter |
| **Full engineering audit** | All 5 agents |

---

## Quick Start

### 1. Prerequisites
- IBM Bob 2.0 installed and configured
- Node.js ≥ 18 (for MCP server)
- A Bob workspace open

### 2. Install the BobSwarm mode
The `.bob/custom_modes.yaml` file is already included. Bob will automatically pick up the **BobSwarm Orchestrator** mode.

### 3. Run the demo
```bash
cd demo
bash run_demo.sh
```

### 4. Try it yourself
Switch to **BobSwarm Orchestrator** mode in Bob and type:

> _"Analyse this codebase, find all bugs, document the public API, and give me an onboarding guide for a new developer."_

BobSwarm will decompose the task and dispatch subagents automatically.

---

## Built On

- **IBM Bob 2.0** — Agent mode, `spawn_subagent`, parallel tasks, skills, custom modes
- **MCP (Model Context Protocol)** — Git, filesystem, and swarm-lifecycle tool exposure

Everything in this repository was built during the Contest window. The
multi-agent execution is IBM Bob's own Agent mode and `spawn_subagent` — see
[`docs/CRITICAL_DECISIONS.md`](docs/CRITICAL_DECISIONS.md) for why this repo
does not depend on any pre-existing codebase.

---

## Hackathon Alignment

| Judging Criterion | How BobSwarm addresses it |
|---|---|
| **Bob feature usage** | Agent mode, spawn_subagent, parallel tasks, custom modes, skills, workflows |
| **Innovation** | First swarm-of-agents orchestrator built natively on Bob |
| **Practicality** | Solves real daily dev pain: debugging, docs, refactoring |
| **Demo quality** | Live demo on real broken codebase with measurable before/after |
| **Team collaboration** | 5 roles, clearly separated, all integrated through a single Bob workflow |
