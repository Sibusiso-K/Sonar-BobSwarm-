# Plan: MCP Server Registration + Live Tool Test

> **Author:** Lethabo (Backend Engineer) via Bob Plan mode  
> **Session date:** 2026-08-28  
> **Bobcoin budget note:** All steps below are surgical — no speculative exploration.

---

## Top-Level Overview

**Goal:** Register `mcp-server/server.js` as a Bob MCP server so its 12 tools are
callable from Agent mode, verify they load, manually invoke `project_summary`,
switch to BobSwarm Orchestrator mode, run a real swarm against `demo/sample-project`,
and document what actually happened (tool call order, parallelism, evidence quality).

**Scope:**
- Create `.bob/mcp.json` (does not yet exist — confirmed by file scan)
- Confirm 12 tools are visible in Agent mode
- Call `project_summary` and capture the real JSON output
- Run one swarm task in BobSwarm Orchestrator mode and observe exactly what tools
  get called, in what order, whether subagents ran in parallel, and whether
  `record_finding` evidence fields contain literal quotes

**Non-goals:**
- Reconnect/retry WebSocket logic (§5c of handoff) — not in scope here
- `write_swarm_report` vs `finalize_run` consolidation decision (§5d) — flag only
- Adding new tools — this session is purely for live verification, not extension

---

## Sub-Task 1: Create `.bob/mcp.json` to register the server

**Status:** `[ ] pending`

**Intent:**  
Bob's MCP registration mechanism is now confirmed: a JSON file at `.bob/mcp.json`
in the project root. This file does not currently exist. Creating it with the
correct `command`/`args`/`cwd` block is the only step required to make the 12
tools visible in Agent mode.

**Expected Outcomes:**
- `.bob/mcp.json` exists at the project root
- Bob's Settings → MCP tab shows a server named `bobswarm` (or equivalent)
- The server entry has `command: "node"`, `args: ["mcp-server/server.js"]`,
  and `cwd` set to the absolute Windows path of the project root

**Todo List:**
1. Create `.bob/mcp.json` with this content:
   ```json
   {
     "mcpServers": {
       "bobswarm": {
         "command": "node",
         "args": ["mcp-server/server.js"],
         "cwd": "C:\\Users\\USER\\Desktop\\IBM 2.0\\bobswarm-repo",
         "alwaysAllow": [
           "git_status", "git_log", "git_diff", "git_blame",
           "list_project_files", "read_project_file", "project_summary",
           "write_swarm_report", "record_progress", "record_finding",
           "finalize_run", "get_run_report"
         ]
       }
     }
   }
   ```
2. Reload/restart Bob (or use the MCP tab reload button if available) so it
   picks up the new file.
3. Confirm: Settings → MCP tab shows `bobswarm` as an active server (green/enabled).

**Relevant Context:**
- Config file location confirmed from Bob docs: `.bob/mcp.json` (project-level)
- Global alternative: `~/.bob/mcp.json` — not needed here; project-level is
  better for team sharing and version control
- `alwaysAllow` list avoids per-tool approval prompts during the demo — all 12
  tools are first-party code, no external side effects beyond disk reads and
  store writes
- The `cwd` path matters on Windows: Node resolves `mcp-server/server.js`
  relative to it, so it must be the repo root, not `mcp-server/` itself

---

## Sub-Task 2: Confirm all 12 tools are visible in Agent mode

**Status:** `[ ] pending`

**Intent:**  
Before calling any tool, verify the server connected successfully and all 12
tools are listed. This catches registration problems (wrong path, Node not in
PATH, port conflict) before the swarm run.

**Expected Outcomes:**
- Agent mode shows all 12 tool names when the MCP server is queried
- No error in the server output (`[BobSwarm MCP] Server running on stdio transport`
  should appear in the server's stderr, which Bob surfaces in the MCP panel)

**Todo List:**
1. Switch to Agent mode.
2. Check the available MCP tools list (via the MCP panel or by asking Bob
   "what MCP tools do you have available?").
3. Confirm these exact 12 names are present:
   - `git_status`, `git_log`, `git_diff`, `git_blame`
   - `list_project_files`, `read_project_file`, `project_summary`, `write_swarm_report`
   - `record_progress`, `record_finding`, `finalize_run`, `get_run_report`
4. If fewer than 12 appear, check which `register*Tools()` call failed — each is
   a separate file (`tools/git.js`, `tools/filesystem.js`, `tools/swarm.js`).
5. Record the exact list observed (for `docs/bob-sessions/lethabo/`).

**Relevant Context:**
- All three tool-group registrations are in [`mcp-server/server.js`](../../mcp-server/server.js) lines 28-30
- If the server crashes on startup (e.g. `events-server.js` port 8787 already in
  use), it will exit before connecting stdio — Bob will report "server failed to
  start." Fix: set `BOBSWARM_EVENTS_PORT=9000` in the `env` block of `mcp.json`

---

## Sub-Task 3: Call `project_summary` against `demo/sample-project`

**Status:** `[ ] pending`

**Intent:**  
Manual live-fire test of a filesystem tool from inside a Bob Agent session.
This is the first time any tool in `tools/filesystem.js` will be called through
the actual MCP transport (all prior testing was direct Node, outside Bob).

**Expected Outcomes:**
- `project_summary` returns a JSON object (not an error)
- The JSON contains at minimum: file list, language/extension breakdown, and
  the project root path — per the tool's implementation
- The call completes without throwing, confirming the stdio transport round-trip works

**Todo List:**
1. In Agent mode, call the `project_summary` MCP tool with `rootPath` =
   `demo/sample-project` (relative path should resolve from `cwd` in `mcp.json`).
2. Capture the raw JSON response exactly as returned — paste into session notes.
3. Verify the response matches the actual files in `demo/sample-project/`:
   - `app.py`, `utils.py`, `data/input.json` (confirmed present by file scan)
4. If the call fails, check whether `rootPath` requires an absolute path — if so,
   use `C:\Users\USER\Desktop\IBM 2.0\bobswarm-repo\demo\sample-project`.
5. Save the raw output to `docs/bob-sessions/lethabo/` as a screenshot or paste.

**Relevant Context:**
- `demo/sample-project/` contains: `app.py`, `utils.py`, `data/` directory
  (confirmed by `list_files` during this planning session)
- The tool is in [`mcp-server/tools/filesystem.js`](../../mcp-server/tools/filesystem.js)
- This is the "hour-10 checkpoint" referenced in the handoff §7 step 4

---

## Sub-Task 4: Switch to BobSwarm Orchestrator mode and run the swarm task

**Status:** `[ ] pending`

**Intent:**  
Run the live swarm against `demo/sample-project` using the registered custom mode.
The mode already exists in [`.bob/custom_modes.yaml`](../../.bob/custom_modes.yaml)
as `bobswarm-orchestrator`. The goal is to observe exactly what happens: which MCP
tools get called, in what order, whether subagents run in parallel, and whether
`record_finding` evidence values are literal code quotes or paraphrased summaries.

**Expected Outcomes:**
- BobSwarm Orchestrator mode activates successfully
- The orchestrator calls `project_summary` or `list_project_files` first (discovery)
- It calls `record_progress` to open a run
- It spawns ≥2 subagents concurrently (parallelism should be visible as overlapping
  tool calls or simultaneous subagent logs)
- Each `record_finding` call includes an `evidence` value that is a verbatim
  quoted string from the actual file content — not a paraphrase
- `finalize_run` is called at the end and returns a structured JSON report
- The report is surfaced in chat

**Todo List:**
1. Switch Bob to **BobSwarm Orchestrator** mode (id: `bobswarm-orchestrator`).
2. Confirm the BobSwarm skill loads (the mode's `roleDefinition` instructs it to
   "follow the orchestration protocol in the BobSwarm skill").
3. Send this exact task:
   > "Analyse demo/sample-project for bugs and trace how data flows through it."
4. Observe and record **in order**:
   - Which tools were called and with what arguments
   - Whether any two tool calls overlapped (parallel subagents)
   - What the `evidence` string looked like in each `record_finding` call —
     was it a literal quote (e.g. `"result = user_data[key]"`) or a description
     (e.g. "the function accesses a dictionary without checking if the key exists")?
5. At the end, call `get_run_report` with the `runId` from step 4 to pull the
   full structured report — capture the JSON.
6. Note whether `finalize_run` was called automatically by the orchestrator or
   had to be called manually.

**Relevant Context:**
- Mode config: [`.bob/custom_modes.yaml`](../../.bob/custom_modes.yaml) — groups
  include `mcp`, so MCP tools are available in this mode
- `record_finding` evidence enforcement: [`mcp-server/store.js`](../../mcp-server/store.js)
  throws if evidence is empty/whitespace — but **non-empty paraphrase will still
  pass the store validation**. Whether it's a real quote depends entirely on
  the persona prompt wording in `agents/*.md` files. Flag any paraphrased
  findings to Farheen (her area, per CONTRIBUTING.md).
- `severity` must be exactly `"breaks"`, `"warns"`, or `"informational"` —
  any other string throws in the store
- Expected bugs in `demo/sample-project/`: 7 planted bugs across `app.py` and
  `utils.py` (per `HANDOVER.md` Mmpoiemang section)

---

## Sub-Task 5: Document results and update team docs

**Status:** `[ ] pending`

**Intent:**  
Capture the session results in the team's documentation so Sibusiso, Farheen,
and the Bob-usage written statement all have a concrete, factual record of what
actually happened in this first live MCP session.

**Expected Outcomes:**
- `docs/CRITICAL_DECISIONS.md` §5a updated with the real MCP registration answer
  (file: `.bob/mcp.json`, schema confirmed)
- `HANDOVER.md` status row for "Git tools" and "Filesystem tools" updated from
  🟡 to ✅ (if tools work) or 🔴 with a note (if they don't)
- Session screenshots/notes saved to `docs/bob-sessions/lethabo/`
- `docs/bob-sessions/CONTRIBUTION_LOG_TEMPLATE.md` entry filled in with:
  - Tools called (in order)
  - Whether parallelism was observed
  - Evidence quality observation (literal quote vs. paraphrase)
  - Any failures and their resolutions

**Todo List:**
1. Update `docs/CRITICAL_DECISIONS.md` §5a with the confirmed registration mechanism.
2. Update `HANDOVER.md` table rows for Git tools, Filesystem tools, and Swarm events.
3. Create `docs/bob-sessions/lethabo/` directory and save session artifacts there.
4. Fill in `docs/bob-sessions/CONTRIBUTION_LOG_TEMPLATE.md` with this session's data.
5. Commit: `docs(mcp): confirm MCP registration mechanism + first live tool test results`
   — push directly to `main` (doc-only, no code change, consistent with team convention).

**Relevant Context:**
- Deliverables checklist in `docs/CRITICAL_DECISIONS.md` §4 requires every team
  member's Bob task-session screenshots — this session generates Lethabo's first ones
- Do **not** update HANDOVER.md to ✅ prematurely — only mark done when tools
  actually work end-to-end through the real Bob session, not just "plan says it will"
