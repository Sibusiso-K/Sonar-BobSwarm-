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

## ✅ Current Integration Baseline — 2026-08-29

The synchronized `main` branch now contains the complete integration baseline.
`npm run verify` passes all orchestrator, demo, backend, frontend, lint, and
production-build checks. The repository is intentionally still a **manual Bob
handoff** proof of concept: the dashboard creates a pending UUID, the operator
copies its handoff prompt into Bob, and Bob's native `spawn_subagent` calls drive
the real MCP events. The dashboard does not claim to invoke Bob automatically.

The backend now enforces `pending → running → complete|error`, makes report
reads side-effect-free, supports bounded sequenced event replay and snapshots,
and rejects writes after terminal state. The frontend reconnects and hydrates
from snapshots. These are real implementation guarantees covered by tests;
they are not pre-cached presentation events.

Synthetic data generation is local-only and writes to
`demo/sample-project/data/synthetic_input.json`. It never posts records to
`POST /runs`; that endpoint accepts only `taskDescription`, `taskType`, and
`repoRef`. Synthetic fixtures and replay are appropriate for zero-cost team
rehearsals, but the submitted video must show one genuine Bob-driven run.

The lead's dashboard evidence is now committed under
`docs/bob-sessions/sibusiso/`: `01-task-prompt.png` and
`02-bob-handoff.png`. These prove the real task-creation and operator-handoff
states. They do not replace the required Bob MCP-panel screenshot.

### Active submission blockers after the current integration pass

| Owner | Remaining work that can still cost points | Evidence in this checkout |
|---|---|---|
| Sibusiso / lead | Capture the Bob MCP-panel `bobswarm` connected screenshot; record the genuine 90–180 second golden-path video; complete the final submission form and eligibility/disclosure confirmations. | Dashboard task, handoff, and waiting-state screenshots are now present; Bob-panel and video are still external actions. |
| Arisha | Add her own Bob task-session screenshots and contribution log; optionally load the designed fonts before the final capture. | `docs/bob-sessions/arisha/` contains no screenshots or contribution log in this checkout. |
| Farheen | No known implementation blocker; keep persona/routing evidence available for the final video. | Persona and routing checks pass; screenshots and contribution evidence are present. |
| Lethabo | No known implementation blocker; use the current MCP server for the final live Bob run and keep the server restart/health check in the recording checklist. | Backend lifecycle, snapshot/replay, and live MCP evidence are present. |
| Mmpoiemang | Prepare the short verbal demo walkthrough and confirm the final expected-output metrics match the recorded run. | Demo validation and fixture evidence pass; walkthrough remains unchecked below. |
| Everyone | Confirm eligibility, employer/affiliation disclosure, and permission to participate before submission. | This cannot be verified from repository files and remains a team action. |

### Lead next actions before submission

- Capture one clean golden-path video with the dashboard UUID handoff visible,
  Bob's parallel `spawn_subagent` calls visible, and the final report grounded
  in literal source evidence.
- Capture the remaining Bob MCP-panel screenshot for Sibusiso, obtain Arisha's
  required Bob session evidence, and complete the outstanding team usage statements.
- Restart the events server immediately before recording so port 8787 serves
  the current checkout; verify `/health` and `/runs` first.
- Reconcile any remaining historical notes below this section only when they
  contradict the implementation; do not use old simulated-flow descriptions.

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
| Task decomposition | Farheen | ✅ Done | `orchestrator/decompose.js` — tested against 14 varied requests; keyword coverage refined; confidence score added to every sub-task |
| Agent personas (all 5) | Farheen | ✅ Done | All 5 personas verified: required sections (43 checks), anti-patterns (17 checks), output format alignment with `system_prompt.md`, end-to-end prompt assembly (2275–2914 chars each) — all pass |
| MCP server | Lethabo | ✅ Done | `.bob/mcp.json` written; 12 tools confirmed via Node verification; `project_summary` returns correct JSON against `demo/sample-project` |
| Git tools | Lethabo | ✅ Done | All 4 tools (`git_status`, `git_log`, `git_diff`, `git_blame`) confirmed live through MCP stdio transport in Session 4 — raw output captured, zero errors |
| Filesystem tools | Lethabo | ✅ Done | `project_summary`, `read_project_file`, `list_project_files` all confirmed live via MCP transport across Sessions 3–4 |
| Swarm events + findings | Lethabo | ✅ Done | Full 5-agent swarm confirmed via MCP tools in Session 4: 42 findings across 5 roles, all evidence verbatim quotes, `finalize_run` returns deterministically sorted report |
| Frontend dashboard | Arisha | 🟢 Real, wired, live-verified | Real React build (not simulation), real WebSocket, confirmed receiving live events from an actual Bob MCP session. Remaining: font-loading bug + polish, see `docs/ARISHA_FRONTEND_POLISH.md` |
| Swarm visualisation | Arisha | ✅ Done | All 5 agent cards + timeline + run history + live timer, all live-data-driven |
| Demo sample project | Mmpoiemang | ✅ Done | 7 bugs planted, `run_demo.sh` written |
| Demo validation | Mmpoiemang | ✅ Done | Full 5-agent swarm run completed; 12 defects found; HTML report + 4 screenshots in `docs/bob-sessions/mmpoiemang/`; Bobalytics metrics added |
| End-to-end test | Sibusiso | ✅ Done | Full 5-agent swarm run completed (Session 1, 2026-08-28) — 8 bugs, 15 docstrings, 7 refactorings, 10 lineage risks, 1 onboarding guide. Report in `docs/bob-sessions/sibusiso/` |

> **Update this table when your status changes. Be specific — "works on my machine" is not ✅ Done.**

---

## 👤 Sibusiso — Lead / Orchestrator

### What's done
- Bob mode (`custom_modes.yaml`) + skill (`SKILL.md`) configured and pushed
- Master orchestration protocol written in `system_prompt.md`
- Full repo scaffold and architecture docs

### What still needs doing
- [x] `.bob/mcp.json` created for `lovilocal.adm` machine — MCP server connects on next Bob startup
- [x] Event schema defined by Lethabo — see `docs/LIVE_EVENTS.md` (signed off)
- [x] System prompt updated to wire in `record_progress`, `record_finding`, `finalize_run` tool calls
- [x] **Live end-to-end orchestration run complete** — 5 agents, 4 parallel + 1 sequential, full Unified Report produced and saved in `docs/bob-sessions/sibusiso/`
- [x] `docs/bob-sessions/sibusiso/CONTRIBUTIONS.md` created — session log for D3 submission
- [x] `orchestrator/decompose.js` confirmed correct against full-audit task (5/5 agents triggered correctly)
- [x] Add dashboard task/handoff screenshots to `docs/bob-sessions/sibusiso/` — `01-task-prompt.png` and `02-bob-handoff.png`
- [ ] Add Bob MCP panel screenshot to `docs/bob-sessions/sibusiso/` — verify `bobswarm` shows Connected (green) after a Bob restart

### Creative freedom
The system prompt and skill are templates — you have full freedom to rewrite,
extend, or restructure the orchestration protocol as you learn what works in practice.
The only constraint: the output must always be a **Unified Report** in the format
defined in `system_prompt.md`.

---

## 👤 Lethabo — Backend Engineer

> Full runbook, tool contract, fallbacks, and the first concrete steps for a
> fresh Bob session: [`docs/LETHABO_BACKEND_HANDOFF.md`](docs/LETHABO_BACKEND_HANDOFF.md)

### What's done
- MCP server skeleton (`mcp-server/server.js`) using stdio transport
- 8 tools written across `tools/git.js` and `tools/filesystem.js`
- `npm install` verified clean (0 vulnerabilities)
- **Event schema defined and implemented** (was listed as Sibusiso-to-define,
  Lethabo+Arisha-to-implement in the Integration Points table below — went
  ahead and shipped a first version so nobody's blocked; open to revising it
  if Sibusiso/Arisha want changes): `progress` / `finding` / `run_complete`,
  full contract in [`docs/LIVE_EVENTS.md`](docs/LIVE_EVENTS.md)
- New MCP tools: `record_progress`, `record_finding` (rejects empty evidence —
  no paraphrased/unsupported findings), `finalize_run`, `get_run_report`
  (`mcp-server/tools/swarm.js`)
- Live events bridge: `mcp-server/events-server.js`, HTTP+WS side-channel so
  the frontend can listen for real swarm activity instead of
  `simulateSwarm()`. Store logic + HTTP endpoints smoke-tested directly
  (run creation, progress, finding validation, deterministic report
  aggregation, WS upgrade path) — **not yet exercised by a real Bob subagent
  session**, that's next
- Merged: PR #1, `feat(mcp): add live swarm events, structured findings, and hackathon rules docs`
- Also added `.gitignore`/`.bobignore` (neither existed) and
  `docs/RULES_SPEC.md` + `docs/CRITICAL_DECISIONS.md` (full hackathon rules
  extraction — flagging the 12.5/20 qualifying floor, which is only in the
  Official Rules PDF, not on either web page)

### Status update — 2026-08-28 21:26 SAST (was stale, corrected)

**Backend core: ~90% done and live-verified**, not blocked. MCP registration
resolved hours ago (`.bob/mcp.json` + portable `.example` template). A live
Bob session confirmed the actual stdio MCP path — not native fallback —
with real parallel dispatch and zero-paraphrase evidence throughout
(`docs/CRITICAL_DECISIONS.md` §5b). Also shipped since the list below was
last accurate: path-traversal guard, Windows path-separator fix, port-conflict
resilience on the events bridge, `Report.summary` field + a sort-consistency
fix between the two report code paths, and a verified live end-to-end test
against Arisha's real frontend (not the placeholder).

### What still needs doing
- [ ] `git.js`'s 4 tools (`git_status`/`git_log`/`git_diff`/`git_blame`) are
      tested directly in Node but **not yet confirmed called through a live
      Bob MCP session** specifically — `filesystem.js` and `swarm.js` are
      confirmed, `git.js` should behave identically but hasn't been exercised
      live yet
- [ ] `write_swarm_report` (writes markdown to disk) vs. `finalize_run`
      (returns structured JSON) still overlap — minor, not blocking
- [ ] Stretch/optional, not core: GitHub API integration (real PR diffs) and
      a Reviewer-persona trust-score badge on the dashboard — ideas in
      `docs/BACKEND_CONCEPTS_AND_VALUE_PROP.md` §5, neither started

### Creative freedom
The 8 original tools are a starting point. If you find the orchestrator needs
something the current tools don't provide (e.g. a `search_in_files` tool, a
`run_tests` tool), add it. Just update `docs/architecture.md` with the new
tool name and description so Sibusiso and Arisha know it exists.

The MCP server transport is stdio by default (Bob-facing). The frontend
integration now runs over a separate HTTP+WS side-channel
(`events-server.js`) rather than stdio — documented in `docs/LIVE_EVENTS.md`.

---

## 👤 Arisha — Frontend Engineer

> **This section was stale** (still described the old `simulateSwarm()`
> placeholder that caused real confusion in team chat — corrected 2026-08-28
> 23:23 SAST). Current status and full polish plan:
> [`docs/ARISHA_FRONTEND_POLISH.md`](docs/ARISHA_FRONTEND_POLISH.md). If
> you're seeing a connection error locally, check
> [`docs/LAUNCH_GUIDE.md`](docs/LAUNCH_GUIDE.md) first — it's almost always
> the backend not running, not a wiring problem.

### What's actually done
- **Full React 19 + TypeScript + Vite build**, replacing the old placeholder
  entirely (merged PR #3, pulled in via `git subtree` for future updates —
  see `docs/architecture.md`). Real, not simulated.
- **Wired to the real WebSocket** — `src/lib/api.ts` + `src/hooks/
  useSwarmRun.ts` connect to `mcp-server/events-server.js` on `:8787`,
  handling `progress`/`finding`/`run_complete` events exactly per
  `docs/LIVE_EVENTS.md`. Verified live twice: once via a manual test run,
  once via a real Bob MCP session with real findings rendering.
- Task input → `POST /runs` → real run created, dashboard subscribes to its
  own WebSocket automatically.
- The copy-ready Bob handoff is now rendered in the live pending-run UI with
  the exact UUID and repository context visible before dispatch.
- Frontend reconnects resume with the last event sequence, hydrate from the
  backend snapshot, deduplicate replayed findings, and render terminal errors.
- **Run history panel + live elapsed timer** — the stretch goal from the
  old list, done (added on top of her build, PR #4).
- Ambient `SwarmField` background (hand-rolled animated SVG), warm dark
  design system (Fraunces/IBM Plex Mono/Inter, gold accent, grain texture).

### What still needs doing
- [ ] **Font loading bug** — the 3 custom fonts are declared in CSS but
      never actually loaded (no `<link>`/`@font-face` anywhere) — every
      browser has been silently falling back to system fonts. Fix + full
      polish plan (positioning, wording, flow) in
      `docs/ARISHA_FRONTEND_POLISH.md`, with a ready-to-paste Bob prompt at
      the bottom of that doc.
- [x] Additive polish items (evidence code-styling, severity visual weight,
      zero-findings empty state, full-run-ID copy button) are complete.

### Creative freedom
The UI template gives you the structure and the colour palette (dark theme, amber).
Beyond that — full creative freedom. Change the layout, add animations, add a
progress percentage, add a Mermaid diagram renderer for the data lineage output,
whatever makes the demo look impressive. The only constraint: the **agent cards**
and the **Unified Report panel** must remain visible and functional for the demo.

---

## 👤 Farheen — AI/ML Engineer

### What's done
- All 5 agent persona files written (`agents/`) and fully verified: required sections, anti-patterns, output format alignment with `system_prompt.md`, end-to-end prompt assembly — all pass
- Task decomposition logic written (`orchestrator/decompose.js`) with keyword-to-agent mapping and dependency rules
- `KEYWORD_MAP` expanded across all 5 agents (15 new keywords added) based on 14-request test run
- `computeConfidence()` added — scores each sub-task 0.0–1.0; every `SubTask` carries a `confidence` field
- Refactorer dependency rule verified via live assertions
- Bob session screenshots + `CONTRIBUTIONS.md` added to `docs/bob-sessions/farheen/`

### What still needs doing
- [x] Test `decompose.js` against 14 varied requests — run `node orchestrator/_test_decompose.js`
- [x] Refine keyword lists in `KEYWORD_MAP` — added: `security`, `vulnerability`, `architecture`, `performance`, `new dev`, `data transformation`, `etl`, `ingestion`, and 10 more (see inline comments in `decompose.js`)
- [x] Read each agent persona and verified output format matches orchestrator aggregation step — all 5 personas use the heading structure `## 🐛/📝/🔧/🧭/🔍 <Agent> Report` which aligns with `system_prompt.md`'s Unified Report sections
- [x] Test the **Refactorer dependency rule** — verified: `parallel=false`, `dependsOn=['debugger']` when both agents triggered; `parallel=true`, `dependsOn=[]` when refactorer-only. See `orchestrator/_test_decompose.js` assertions.
- [x] (Stretch) Add a confidence score to each sub-task — `computeConfidence()` added; score = matched keywords / total keywords, range 0.0–1.0, exported in module

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
- [X] Run `bash demo/run_demo.sh` and confirm it executes without script errors
- [X] Verify `python3 demo/sample-project/app.py` actually crashes on at least 2 of the 7 bugs
- [X] Cross-check `expected_output.md` against what the real swarm produces — update it if the swarm finds more
- [X] (Stretch) Add a **Bobalytics** section to `expected_output.md`: what metrics does the swarm produce? (agents dispatched, time to complete, issues found per severity)
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
| Event schema | Lethabo → Arisha | `progress` / `finding` / `run_complete` payload (v1 shipped, open to revision) | Implemented by Lethabo — see `docs/LIVE_EVENTS.md`. Confirm with Arisha before she wires against it |
| Report format | Sibusiso → Arisha | The markdown structure of the Unified Report | Sibusiso (already defined in `system_prompt.md`) |
| Demo input | Mmpoiemang → everyone | The files the swarm runs against | Mmpoiemang |

---

## 🚀 How to Run Everything Locally

### MCP Server (Lethabo)
```bash
cd mcp-server
npm install
node server.js
# Also starts the live-events HTTP+WS bridge on http://localhost:8787
# (override port with BOBSWARM_EVENTS_PORT). To run just that side-channel
# standalone for frontend dev without a Bob session attached:
node events-server.js
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

**Sample output (verified):**
```json
[
  {
    "agent": "debugger",
    "task": "Analyse the provided codebase for bugs, errors, and unexpected behaviour.\nOriginal request context: \"find bugs and document the API\"\nDeliverable: A numbered list of issues found, each with file path, line reference, root cause, and suggested fix.",
    "context": ["demo/sample-project/app.py"],
    "parallel": true,
    "dependsOn": [],
    "confidence": 0.07
  },
  {
    "agent": "documenter",
    "task": "Generate comprehensive documentation for the provided codebase.\nOriginal request context: \"find bugs and document the API\"\nDeliverable: Inline code comments, a public API reference, and a high-level module overview.",
    "context": ["demo/sample-project/app.py"],
    "parallel": true,
    "dependsOn": [],
    "confidence": 0.07
  }
]
```

> **Why `dependsOn` is empty:** The dependency rule only applies to the **refactorer** — it depends on debugger when both are triggered. This request has no `refactor`/`clean`/`improve` keyword so refactorer is never matched. Debugger and documenter are always independent of each other, so both run in parallel with no dependencies. Expected behaviour. ✅

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

---

## 📝 D3 — Bob Usage Statement Paragraphs

> **What this section is for:**
> The hackathon requires a written statement (D3) describing how and where the team used IBM Bob — tool calls made, decisions Bob took, outputs produced. Each team member writes their own paragraph here. **Sibusiso assembles all 5 into the final D3 field on the submission form.**
>
> **What your paragraph should cover:**
> - The literal task/prompt you gave Bob
> - Which tools Bob called (e.g. `read_file`, `execute_command`, `apply_diff`, `spawn_subagent`)
> - What Bob decided or discovered during the session
> - What it produced (files changed, tests run, findings returned)
> - Be specific — vague claims like "Bob helped me build the backend" don't satisfy the rules

---

### Submission tracker

| Member | Role | Paragraph added? |
|---|---|---|
| Sibusiso | Lead / Orchestrator | ✅ |
| Lethabo | Backend Engineer | ✅ |
| Arisha | Frontend Engineer | ✅ |
| Farheen | AI/ML Engineer | ✅ |
| Mmpoiemang | Data / QA Engineer | ✅ |

---

### Farheen — AI/ML Engineer

This session, I had Bob finish up the leftover AI/ML engineering work from the handover doc.

Bob started by reading `HANDOVER.md`, `README.md`, `orchestrator/decompose.js`, all 5 agent persona files, and `docs/agent_personas.md`, all in parallel, before touching anything. Wanted to get the full picture first instead of guessing.

Then Bob ran `decompose.js` against 14 different plain-language requests to see how it handled them. Turned out things like `"security audit the application"`, `"explain the architecture"`, and `"how does the data transformation work"` weren't routing to the right agents — they were just falling back to a full audit. So Bob went into `KEYWORD_MAP` and added 15 new keywords across the 5 agents, without messing with the existing logic.

After that, Bob built the stretch goal: a `computeConfidence()` function that scores each sub-task from 0.0 to 1.0 based on how strong the keyword match is, and added that as a `confidence` field on every sub-task.

Bob also checked the Refactorer dependency rule with live tests — confirmed that when both `fix` and `refactor` show up, refactorer gets `parallel=false` and depends on the debugger, and when `refactor` shows up alone it just runs on its own.

Last thing, Bob ran three rounds of checks on all 5 persona files, checking 43 required sections, 17 anti-pattern rules, output format matching `system_prompt.md`, and full prompt assembly (prompts came out between 2275–2914 characters per agent). Everything passed, and no leftover scripts in the project.

---

### Sibusiso — Lead / Orchestrator

For my session, I acted as the Orchestrator and gave Bob the prompt: *"Analyse demo/sample-project for bugs, document the public API, suggest refactoring improvements, trace the data flow, and create an onboarding guide."* Bob started by using `read_file` to read the orchestration protocol (`orchestrator/system_prompt.md`), all 5 agent personas, and the source files simultaneously to get the full picture. Then, Bob used `execute_command` to run `orchestrator/decompose.js`, dynamically decomposing the prompt into 5 specialized sub-tasks. Bob correctly identified dependencies and used `spawn_subagent` to dispatch 4 agents (Debugger, Documenter, Onboarding, Data Lineage) in parallel, and then dispatched the Refactorer sequentially after passing it the Debugger's findings. This resulted in a comprehensive 41-finding unified report (`docs/bob-sessions/sibusiso/unified-report-session-1.md`). Later, I also had Bob help me resolve 3 blockers before merging a PR by using file editing tools to remove tracked `__pycache__` files, fix three bugs in `app.py`, and restore stripped docstrings in `utils.py`.

---

### Lethabo — Backend Engineer

For Session 6, I tasked Bob with validating the frontend-to-backend live bridge. My prompt was: *"Use existing runId 827af00d-9bf3-4aad-8343-40821ca4a115 created by the frontend. Do not create a second run. Dispatch the full 5-agent swarm against this runId so the already-open dashboard receives events live."* Using its tools, Bob made an HTTP `GET` to the backend to verify the pending run existed. Bob then dispatched all 5 subagents in parallel (spawn_subagent). Through the BobSwarm MCP stdio transport tools, the subagents published `record_progress` and `record_finding` events live to the WebSocket connected to the frontend. The session finalized with 41 findings from the 5 specialists with verbatim code quotes—no paraphrasing. It confirmed our dashboard architecture worked cleanly without pre-briefing the subagents.

---

### Arisha — Frontend Engineer

To polish the UI for our final submission, I prompted Bob to: *"Read docs/ARISHA_FRONTEND_POLISH.md... Fix the font loading bug... adjust Hero.tsx positioning and wording... Reduce empty-state stacking and add auto-scroll... If time allows, add a full-run-ID copy button."* Using `replace_file_content`, Bob added the Google Fonts `<link>` tags to `index.html` to load Fraunces, IBM Plex Mono, and Inter. Bob then updated `Hero.tsx` to feature an asymmetric layout and refined the hook phrasing. To streamline the UX, Bob added a smooth auto-scroll to the Swarm stage upon dispatch and a "Copy Full Run ID" button to make bridging runs with Bob seamless during the demo, conditionally hiding empty states in `App.tsx` until a run was actively created.

---

### Mmpoiemang — Data / QA Engineer

To validate the multi-agent QA flow, I tasked Bob with: *"Analyse the codebase at demo/sample-project. Find all bugs, document the public API, suggest refactoring improvements, trace the data flow, and create an onboarding guide."* Bob loaded the agent personas and used `read_project_file` across `app.py`, `utils.py`, and `data/input.json`. Bob successfully spawned all 5 specialized subagents. The SwarmDebugger caught all planted defects (including a silent None propagation and resource leak) while the Data Lineage mapped the failure propagation paths. This proved our automation could detect 12 defects (including criticals and highs) across files in under 5 minutes without manual test suite configuration, aggregating the output cleanly.

