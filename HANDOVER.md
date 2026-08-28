# 🐝 BobSwarm — Team Handover Document

> **Maintained by the whole team.** When you finish a piece of work, update your section and push.
> Keep it honest — mark things done only when they actually work end-to-end.

---

## What We Are Building

BobSwarm is an on-demand, multi-agent orchestrator built on IBM Bob 2.0.
A developer describes any complex engineering task in plain language.
BobSwarm decomposes it, spawns a swarm of specialist subagents that run **in parallel**,
and returns a single structured report.

**The end-to-end flow:**
```
User types a task
    → BobSwarm Orchestrator (Bob Agent mode) reads it
    → decompose() splits it into sub-tasks
    → spawn_subagent × N fires in parallel (each loaded with a specialist persona)
    → All agents return findings
    → Orchestrator aggregates into Unified Report
    → Frontend dashboard shows live progress + final report
    → MCP server tools power file/Git access throughout
```

This must work fully end-to-end for the demo. Every part of the stack matters.

---

## 🗂 Repo Map — Who Owns What

```
.bob/
  custom_modes.yaml          ← Sibusiso
  skills/bobswarm/SKILL.md   ← Sibusiso

orchestrator/
  system_prompt.md           ← Sibusiso
  decompose.js               ← Farheen

agents/
  debugger.md                ← Farheen
  documenter.md              ← Farheen
  refactorer.md              ← Farheen
  onboarding.md              ← Farheen
  data_lineage.md            ← Farheen

mcp-server/
  server.js                  ← Lethabo
  tools/git.js               ← Lethabo
  tools/filesystem.js        ← Lethabo

frontend/
  index.html                 ← Arisha
  style.css                  ← Arisha
  app.js                     ← Arisha

demo/
  sample-project/app.py      ← Mmpoiemang
  sample-project/utils.py    ← Mmpoiemang
  sample-project/data/       ← Mmpoiemang
  run_demo.sh                ← Mmpoiemang
  expected_output.md         ← Mmpoiemang

docs/
  architecture.md            ← Sibusiso
  agent_personas.md          ← Farheen
  CONTRIBUTING.md            ← Everyone
```

---

## ✅ Current Status

| Area | Owner | Status | Notes |
|---|---|---|---|
| Bob mode config | Sibusiso | ✅ Done | `.bob/custom_modes.yaml` registered |
| Orchestration skill | Sibusiso | ✅ Done | `.bob/skills/bobswarm/SKILL.md` ready |
| Master system prompt | Sibusiso | ✅ Done | `orchestrator/system_prompt.md` complete |
| Task decomposition | Farheen | 🟡 Template ready | `orchestrator/decompose.js` — needs real-world testing |
| Agent personas (all 5) | Farheen | 🟡 Template ready | `agents/` — test each against sample project |
| MCP server | Lethabo | 🟡 Skeleton ready | `mcp-server/` — needs `npm install` + local test |
| Git tools | Lethabo | 🟡 Skeleton ready | 4 tools written, not yet tested live |
| Filesystem tools | Lethabo | 🟡 Skeleton ready | 4 tools written, not yet tested live |
| Frontend dashboard | Arisha | 🟡 Skeleton ready | Simulation works; needs real SSE wiring |
| Swarm visualisation | Arisha | 🟡 Skeleton ready | All 5 agent cards + timeline present |
| Demo sample project | Mmpoiemang | ✅ Done | 7 bugs planted, `run_demo.sh` written |
| Demo validation | Mmpoiemang | 🟡 In progress | `expected_output.md` written; needs live validation |
| End-to-end test | Sibusiso | ⬜ Not started | Blocked until MCP + personas tested |

> **Update this table when your status changes. Be specific — "works on my machine" is not ✅ Done.**

---

## 👤 Sibusiso — Lead / Orchestrator

### What's done
- Bob mode (`custom_modes.yaml`) + skill (`SKILL.md`) configured and pushed
- Master orchestration protocol written in `system_prompt.md`
- Full repo scaffold and architecture docs

### What still needs doing
- [ ] Run a live end-to-end test in Bob once the MCP server is up (switch to BobSwarm Orchestrator mode, fire the demo task)
- [ ] Define the event schema for Lethabo → Arisha integration in `docs/architecture.md`
  - What events does the backend emit? (`agent_started`, `agent_done`, `swarm_complete`)
  - What payload does each carry?
- [ ] Review Farheen's decompose.js output against 5+ real requests and adjust keyword coverage if needed
- [ ] Final aggregation check: does the Unified Report format hold up when all 5 agents return?

### Creative freedom
The system prompt and skill are templates — you have full freedom to rewrite,
extend, or restructure the orchestration protocol as you learn what works in practice.
The only constraint: the output must always be a **Unified Report** in the format
defined in `system_prompt.md`.

---

## 👤 Lethabo — Backend Engineer

### What's done
- MCP server skeleton (`mcp-server/server.js`) using stdio transport
- 8 tools written across `tools/git.js` and `tools/filesystem.js`

### What still needs doing
- [ ] `cd mcp-server && npm install` — install dependencies
- [ ] Test each tool locally:
  ```bash
  node -e "require('./server.js')"
  # Then call each tool manually and verify output
  ```
- [ ] Register the MCP server in Bob's MCP config so the orchestrator can call tools
- [ ] Add a `write_swarm_report` call at the end of a swarm run to persist the report
- [ ] (Stretch) Emit SSE events as agents complete — coordinate the event schema with Sibusiso and Arisha

### Creative freedom
The 8 tools are a starting point. If you find the orchestrator needs something the
current tools don't provide (e.g. a `search_in_files` tool, a `run_tests` tool),
add it. Just update `docs/architecture.md` with the new tool name and description
so Sibusiso and Arisha know it exists.

The MCP server transport is stdio by default. If you want to switch to HTTP/SSE
for the frontend integration, that's your call — just document it.

---

## 👤 Arisha — Frontend Engineer

### What's done
- Full dashboard HTML (`frontend/index.html`) with agent cards, task input, results panel, timeline
- Dark amber theme CSS (`frontend/style.css`)
- Swarm simulation in `frontend/app.js` — `simulateSwarm()` mirrors the real agent lifecycle

### What still needs doing
- [ ] Open `frontend/index.html` in a browser and verify the simulation looks right end-to-end
- [ ] Replace `simulateSwarm()` with real event listener once Lethabo's event schema is confirmed
  - Listen for: `agent_started`, `agent_done`, `swarm_complete`
  - Update agent card state + timeline on each event
- [ ] Wire the task input to actually send the request to the orchestrator (HTTP POST or direct Bob integration)
- [ ] Make sure the **Copy Report** button works on the final unified report
- [ ] (Stretch) Add a run history panel — list of past swarm runs with timestamps

### Creative freedom
The UI template gives you the structure and the colour palette (dark theme, amber).
Beyond that — full creative freedom. Change the layout, add animations, add a
progress percentage, add a Mermaid diagram renderer for the data lineage output,
whatever makes the demo look impressive. The only constraint: the **agent cards**
and the **Unified Report panel** must remain visible and functional for the demo.

---

## 👤 Farheen — AI/ML Engineer

### What's done
- All 5 agent persona files written (`agents/`)
- Task decomposition logic written (`orchestrator/decompose.js`) with keyword-to-agent mapping and dependency rules

### What still needs doing
- [ ] Test `decompose.js` against at least 10 varied requests:
  ```bash
  node -e "
    const { decompose } = require('./orchestrator/decompose');
    console.log(JSON.stringify(decompose('find all the bugs and document the API'), null, 2));
  "
  ```
- [ ] Refine keyword lists in `KEYWORD_MAP` based on test results
- [ ] Read each agent persona out loud (or paste it into Bob) and verify the output format is exactly what the orchestrator's aggregation step expects
- [ ] Test the **Refactorer dependency rule** — it must receive Debugger findings before running
- [ ] (Stretch) Add a confidence score to each sub-task: how certain is the decomposition that this agent is needed?

### Creative freedom
The persona templates define the output format and anti-patterns — those must stay.
Everything else is yours: the tone of the persona, the investigation protocol steps,
the level of detail in the task descriptions built by `buildTaskDescription()`.
If you think a 6th agent type (e.g. a **Security Auditor** or a **Test Writer**) would
strengthen the demo, add it — just follow the extension guide in `docs/agent_personas.md`.

---

## 👤 Mmpoiemang — Data / QA Engineer

### What's done
- Sample broken project (`demo/sample-project/`) with 7 planted bugs across `app.py` and `utils.py`
- Input data (`data/input.json`) with edge-case records
- Demo script (`run_demo.sh`) that proves the pipeline fails before the swarm runs
- Expected output reference (`expected_output.md`) for all 5 agents

### What still needs doing
- [ ] Run `bash demo/run_demo.sh` and confirm it executes without script errors
- [ ] Verify `python3 demo/sample-project/app.py` actually crashes on at least 2 of the 7 bugs
- [ ] Cross-check `expected_output.md` against what the real swarm produces — update it if the swarm finds more
- [ ] (Stretch) Add a **Bobalytics** section to `expected_output.md`: what metrics does the swarm produce? (agents dispatched, time to complete, issues found per severity)
- [ ] Prepare a 60-second verbal walkthrough of the demo for demo day — you're the one who runs it live

### Creative freedom
The sample project is intentionally broken Python — but if you want to add a second
language (e.g. a broken JavaScript file) to show BobSwarm handles polyglot repos,
go for it. Just add the new files under `demo/sample-project/` and update
`expected_output.md` with the additional expected findings. The more impressive the
demo target, the more impressive the swarm output.

---

## 🔗 Integration Points — Read This Before You Merge

These are the seams where components connect. **Coordinate before changing these.**

| Interface | Between | What it is | Owner to define |
|---|---|---|---|
| Agent persona format | Farheen → Sibusiso | The output structure each agent returns | Farheen (already templated) |
| MCP tool names | Lethabo → Sibusiso | The exact tool names the orchestrator calls | Lethabo |
| Event schema | Lethabo → Arisha | `agent_started / agent_done / swarm_complete` payload | Sibusiso to define, Lethabo + Arisha to implement |
| Report format | Sibusiso → Arisha | The markdown structure of the Unified Report | Sibusiso (already defined in `system_prompt.md`) |
| Demo input | Mmpoiemang → everyone | The files the swarm runs against | Mmpoiemang |

---

## 🚀 How to Run Everything Locally

### MCP Server (Lethabo)
```bash
cd mcp-server
npm install
node server.js
```

### Frontend (Arisha)
```bash
# No build step — open directly
open frontend/index.html
# or on Windows:
start frontend/index.html
```

### Demo (Mmpoiemang)
```bash
# Requires Python 3.10+ and pip install requests
bash demo/run_demo.sh
```

### Decomposition tests (Farheen)
```bash
node -e "
  const { decompose } = require('./orchestrator/decompose');
  console.log(JSON.stringify(decompose('find bugs and document the API', ['demo/sample-project/app.py']), null, 2));
"
```

### Full end-to-end (Sibusiso)
1. Ensure MCP server is registered in Bob's config
2. Switch Bob to **BobSwarm Orchestrator** mode
3. Paste: _"Analyse the codebase at demo/sample-project. Find all bugs, document the public API, suggest refactoring, trace the data flow, and write an onboarding guide."_
4. Verify 5 agents fire in parallel and a Unified Report comes back

---

## 📌 Ground Rules

1. **Push often.** Small commits are better than one giant one at the end.
2. **Update this file** when your status changes. The team reads this, not Slack.
3. **Don't break the demo path.** The files in `demo/sample-project/` are the demo target — don't fix the bugs in them.
4. **Coordinate on integration points** before changing tool names, event shapes, or report formats.
5. **Creative freedom within your area** — templates exist to save time, not to cage you. Make your part great.
