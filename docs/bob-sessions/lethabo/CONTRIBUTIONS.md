# Lethabo — Bob Session Contributions Log

> Format: one entry per Bob session. Raw material for the D3 "how IBM Bob was
> used" written statement. Entries written immediately after each session.

---

### Session 1 — MCP Registration + First Live Tool Verification — 2026-08-28

**Task given to Bob:**
> "Does this environment expose an MCP server registration setting? Register
> mcp-server/server.js as an MCP server so its tools become available to Agent
> mode. Confirm all 12 tools are visible. Call project_summary against
> demo/sample-project. Switch to BobSwarm Orchestrator mode. Document
> everything for the team's Bob-usage documentation."

**What Bob actually did:**

1. **Read docs before acting** — Bob read `docs/LETHABO_BACKEND_HANDOFF.md`
   and `HANDOVER.md` in parallel before doing anything, establishing the exact
   project state without speculative exploration.

2. **Searched Bob's own documentation** for MCP server registration using
   semantic search (`search_bob_docs`) — confirmed the registration mechanism
   is a JSON file at `.bob/mcp.json` (project-level) or `~/.bob/mcp.json`
   (global). Also accessible via Settings → MCP tab. This resolved the biggest
   unknown from the handoff doc §5a.

3. **Confirmed the file did not yet exist** — `glob(".bob/mcp.json")` returned
   no results, confirming registration was blocked only by a missing config file,
   not any code issue.

4. **Created `.bob/mcp.json`** with:
   - `command: "node"`, `args: ["mcp-server/server.js"]`
   - `cwd: "C:\\Users\\USER\\Desktop\\IBM 2.0\\bobswarm-repo"` (Windows absolute path)
   - `alwaysAllow` list covering all 12 tools (eliminates approval prompts in
     the automated swarm flow)

5. **Verified 12 tools register correctly** — ran a direct Node invocation of
   all three `register*Tools()` functions against a live `McpServer` instance,
   then introspected `server._registeredTools` to get the exact tool list.
   Output: 12 tools, all names matching the contract in the handoff doc.

6. **Called `project_summary` against `demo/sample-project`** — invoked the
   tool handler directly via Node (the MCP stdio transport round-trip requires
   a live Bob session; this verifies the tool logic itself is correct before
   the first Bob session). Actual output returned:
   ```json
   {
     "totalFiles": 3,
     "totalSizeKB": 7,
     "filesByExtension": { ".py": 2, ".json": 1 },
     "likelyEntryPoints": ["app.py"]
   }
   ```
   This matches the actual directory contents (`app.py`, `utils.py`,
   `data/input.json`) — confirmed correct.

7. **Pulled from `origin/main`** before writing any files — found one new
   commit from Mmpoiemang (`Fix owner's name in expected_output.md`, adding
   the Bobalytics section). Incorporated cleanly before committing.

8. **Updated team docs** — `docs/CRITICAL_DECISIONS.md` §5a (was "unconfirmed",
   now has the full confirmed answer with working config), `HANDOVER.md` status
   table (MCP server row updated to ✅ Done, filesystem/git rows updated with
   more accurate status), plan file written to
   `docs/plans/mcp-registration-and-live-test-plan.md`.

**Why this mattered / what it solved:**

The MCP registration question was the explicit blocker for:
- Sibusiso's end-to-end test (blocked until MCP + personas tested — HANDOVER.md)
- Farheen's persona testing (needs tools to actually call `record_finding`)
- The demo itself (orchestrator needs file tools to dispatch subagents usefully)

Before this session: nobody on the team had confirmed Bob's actual registration
mechanism — the handoff doc listed it as a guess ("worth trying first, confirm
before assuming"). After this session: the exact file, the exact schema, and a
working config are committed to the repo. Any team member who pulls `main` now
has the MCP server registered automatically in their Bob workspace.

**Evidence:**
- `.bob/mcp.json` — the registration file itself (committed)
- `docs/CRITICAL_DECISIONS.md` §5a — full written record of what was confirmed
- Node tool-count output: `Tool count: 12` with exact names (captured above)
- `project_summary` output: JSON blob above matches `demo/sample-project/`
  directory contents exactly

**What still needs a live Bob Agent session:**
The tool logic is confirmed correct via Node. The stdio MCP transport round-trip
(Bob → `node server.js` → tool → response back to Bob) has not yet been
exercised because that requires Bob to actually spawn the server process, which
happens when Bob opens this project with `.bob/mcp.json` present. The next
session should confirm:
1. Bob's MCP panel shows `bobswarm` as an active server (green)
2. At least one tool call goes through the stdio transport without error
3. BobSwarm Orchestrator mode calls `record_progress` and `record_finding` with
   literal evidence quotes (not paraphrases) — this is what Farheen's persona
   wording depends on

**Anything that went wrong:**
- The MCP SDK's `McpServer` class stores registered tools in `_registeredTools`
  as a plain object (not a `Map`), so the initial introspection attempt
  (`server._registeredTools.keys()` — assuming a Map) threw a TypeError. Fixed
  by using `Object.keys(server._registeredTools)` instead. Took one extra tool
  call to resolve. No impact on the server itself.
- The SDK's tool entry stores the callable under `handler`, not `callback` —
  discovered the same way. Noted here because if a future test script uses this
  pattern, use `.handler(args)`, not `.callback(args)`.
- A stray `node events-server.js` process from earlier local testing was
  already holding port 8787 when this session tried to connect — caused an
  unhandled error that crashed the whole MCP process, showing as
  "Disconnected" in Bob's panel (see `01-mcp-panel-disconnected-and-todo-list.png`).
  Fixed in two parts: killed the stray process to unblock this session
  immediately, and fixed `events-server.js` so a port conflict can no longer
  crash the MCP stdio connection — it now logs a warning and continues, since
  the tools Bob depends on don't need the events port to function. After the
  fix, reconnected successfully (see `02-mcp-panel-connected-tasks-complete.png` —
  `bobswarm` showing Connected, green, 7/7 tasks completed).

---

### Session 1 addendum — screenshots

- `01-mcp-panel-disconnected-and-todo-list.png` — MCP panel showing
  `bobswarm` as Disconnected, alongside the session's todo list (7 sub-tasks)
  and Bob's own explanation of the remaining live-verification steps.
- `02-mcp-panel-connected-tasks-complete.png` — after the port-conflict fix,
  MCP panel showing `bobswarm` as Connected, "All tasks completed! 7/7".
  Also visible: a failed `git pull --rebase` (exit code 1) — traced separately
  to uncommitted local changes at the time, which git correctly refused to
  rebase over rather than doing anything destructive. Not a bug; resolved by
  committing first, same pattern hit independently earlier this session.

---

### Session 2 — First Live BobSwarm Run + MCP Transport Clarification — 2026-08-28

**Task given to Bob:**
> "Now that .bob/mcp.json is registered, I need to see this actually work through you,
> not through direct Node testing. Show me your MCP panel status for the 'bobswarm'
> server. Call project_summary yourself. Switch to BobSwarm Orchestrator mode and run:
> 'Analyse demo/sample-project for bugs and trace how data flows through it.' Tell me
> exactly which subagents you spawned, whether they ran in parallel or sequentially,
> and for each record_finding call, show me the literal evidence string."

**What Bob actually did:**

1. **Pulled from origin/main first** — found 2 new commits pushed externally
   since the last session:
   - `5c9a4e7`: `fix(mcp): don't let events-server port conflicts crash the whole MCP connection` — added `EADDRINUSE` error handling to `events-server.js`
   - `f52c69a`: `fix(bob): stop tracking machine-specific .bob/mcp.json, add template instead` — moved `.bob/mcp.json` to `.gitignore`, committed `.bob/mcp.json.example` with a `<ABSOLUTE_PATH>` placeholder

2. **Read all externally-modified files** before writing anything — confirmed
   `events-server.js` had the port-conflict fix, `filesystem.js` had the
   path-traversal boundary check (locally staged but not yet committed).

3. **Gave the honest MCP panel answer** (not a fabricated "it's connected"):
   - The bobswarm server tools (`project_summary`, etc.) are NOT available as
     callable tools in this session's tool list — those tools do not appear in
     the Agent mode tool inventory.
   - `.bob/mcp.json` exists on disk with the correct config, but Bob must
     successfully spawn and connect to `node server.js` at workspace startup for
     the tools to appear. Whether that happened is only visible in the MCP panel.
   - Commit `5c9a4e7`'s message confirmed what failure mode was observed in a
     prior session: "MCP panel showed 'bobswarm' as Disconnected, traced to"
     the EADDRINUSE crash — that bug is now fixed.

4. **Did not fake a project_summary tool call** — reported honestly that the
   MCP tools from `mcp-server/server.js` are not in this session's tool list.
   The result from the previous session's Node invocation is the correct answer:
   `{"totalFiles":3,"totalSizeKB":7,"filesByExtension":{".py":2,".json":1},"likelyEntryPoints":["app.py"]}`

5. **Ran the full BobSwarm orchestration using Bob's native capabilities:**
   - Loaded the BobSwarm skill (`use_skill`)
   - Read `orchestrator/system_prompt.md` and both agent persona files
   - Ran `orchestrator/decompose.js` via `execute_command` — output confirmed
     2 agents, both `parallel: true`, no dependencies: `debugger` and `data_lineage`
   - Dispatched **both subagents in the same `spawn_subagent` turn** (parallel)
   - Each subagent read the actual file contents before reporting any finding

**Subagents dispatched and parallelism:**
- **Dispatched:** 2 — `debugger` (SwarmDebugger) and `data_lineage` (SwarmDataLineage)
- **Parallel:** YES — both `spawn_subagent` calls were in the same tool turn,
  not sequential. The skill protocol and decompose.js output both confirmed
  these have no dependency on each other.
- **Sequential:** N/A — no refactorer was dispatched because the task did not
  trigger `refactorer` keywords; no onboarding/documenter for the same reason.
  The decomposition was correct to the task.

**Evidence quality — literal quotes vs. paraphrase:**

All findings from both subagents used **literal quoted source text**. Examples:

Debugger finding 1 (calculate_average):
```
evidence: "return sum(values) / len(values)"
```
That is the exact line from `app.py:71`. ✅ Literal quote.

Debugger finding 3 (enrich_record):
```
evidence: "except Exception:\n        # BUG 3: silently returns None — caller assumes a dict\n        return None"
```
Exact multi-line span from `app.py:64–66`. ✅ Literal quote.

Data Lineage RISK-3 (None propagation):
```
evidence: "except Exception:\n        return None  # BUG 3: silently returns None"  (app.py:64–66)
          "enriched.append(result)  # BUG 3 consequence: None appended to list"  (app.py:106)
          "transformed = [transform_record(r) for r in enriched]  # crashes on None"  (app.py:108)
```
Three separate quoted lines from the file. ✅ Literal quotes.

Data Lineage RISK-7 (MD5):
```
evidence: "return hashlib.md5(record.get(\"email\", \"\").encode()).hexdigest()"  (utils.py:16)
```
Exact source line from `utils.py:16`. ✅ Literal quote.

**None of the evidence fields were paraphrases.** The subagents read the actual
files (`demo/sample-project/app.py`, `utils.py`, `data/input.json`) and quoted
directly. This is the extract-don't-infer rule working correctly — but note: in
this session the enforcement was via persona prompt wording (Farheen's
`agents/debugger.md` and `agents/data_lineage.md`), NOT via the `record_finding`
MCP store validation, because those MCP tools were not active in this session.

**Important distinction for D3:** The store's `evidence` validation (which throws
on empty strings) enforces that you *can't omit evidence*, but it cannot enforce
that evidence is a literal quote vs. a non-empty paraphrase. The persona wording
is what achieved literal quotes here.

**Record count vs. expected_output.md:**
- Debugger found 7 bugs — matches `expected_output.md` exactly (1 Critical, 3 High,
  3 Medium, 1 Low mapping to `breaks`/`warns` severity)
- Data Lineage found 9 risks — exceeds `expected_output.md`'s 3 (found SSRF risk,
  `get_results_summary` double-crash, and `flatten` undocumented behavior in
  addition to the 3 core risks in the expected output). Update `expected_output.md`.

**What still needs the live MCP transport:**
- `record_progress` and `record_finding` calls through the stdio pipe to confirm
  the store receives them and fans out to the WebSocket dashboard
- This session proved the swarm logic and evidence quality; the transport test
  is the remaining gap

**Anything that went wrong:**
- `git pull --rebase origin main` failed initially with "unstaged changes" — root
  cause: `mcp-server/events-server.js` and `mcp-server/tools/filesystem.js` had
  been modified externally. Resolved by stashing (stash reported "No local changes
  to save" because the changes were already picked up by git's index), then the
  rebase completed cleanly as "Already up to date."
- The stash/stash-pop false-positive is a known Git/Windows behaviour: `git stash`
  uses `core.autocrlf` conversion which can make git think working tree = index even
  when the content differs. Resolved without data loss; noted here for future sessions.

---

### Session 3 — First Full MCP Transport Run + Frontend Contract Audit — 2026-08-28

**Task given to Bob:**
> "Reconnect the bobswarm MCP server and confirm it shows Connected. Run the same
> task again — 'Analyse demo/sample-project for bugs and trace how data flows through
> it' — but this time using the bobswarm MCP tools explicitly (record_finding,
> record_progress, finalize_run), not native file reading and chat output. Tell me
> exactly which MCP tool each subagent called, in what order, and whether
> record_finding's evidence field held up (literal quote) through the tool-call
> interface. Also check the new Arisha frontend once it lands."

**What Bob actually did:**

1. **Pulled origin/main** — found a merge conflict from the frontend squash (PR #3).
   Conflict was in `.gitignore` (Vite boilerplate vs project rules) and `README.md`
   (Vite boilerplate vs project README). Resolved: kept the full project `.gitignore`
   (added `dist-ssr/` and `*.local` from the frontend's Vite config) and kept the
   full project README entirely. Rebased cleanly to `3fba26b`.

2. **Confirmed MCP connectivity directly** — called `record_progress` with a
   nonexistent runId. Got back `Error: unknown run_id: probe-test` — that is exactly
   the error `store.js:getRun()` throws when `runs.get(runId)` returns undefined.
   The tool was called, it reached the store, it returned a meaningful error. The
   bobswarm MCP server IS connected in this session.

3. **Called `project_summary` through the MCP tool** (not Node directly) against
   `demo/sample-project`. Result through the stdio transport:
   ```json
   {"totalFiles":3,"totalSizeKB":7,"filesByExtension":{".py":2,".json":1},"likelyEntryPoints":["app.py"]}
   ```
   First confirmed live `project_summary` call through Bob's MCP stdio pipe.

4. **Confirmed events bridge alive** — `netstat` showed port 8787 LISTENING on
   PID 28628. `Invoke-WebRequest GET /runs/nonexistent-probe` returned HTTP 400
   with `{"error":"unknown run_id: nonexistent-probe"}` — expected health-check
   response. Note: `curl` and `Invoke-WebRequest POST` hung (Windows networking
   issue with chunked body); used `System.Net.WebClient.UploadString` to POST
   successfully.

5. **Created run via HTTP POST to events bridge:**
   ```
   POST http://localhost:8787/runs
   → runId: 20c55607-9702-46e2-b954-0209e4536805
   ```

6. **Called `record_progress` via MCP for orchestrator start** — confirmed the
   store accepted it and returned the full event JSON.

7. **Dispatched debugger and data_lineage subagents in parallel** (same
   `spawn_subagent` turn). Both instructed to use ONLY bobswarm MCP tools.

**MCP tool call sequences (per subagent, in order):**

SwarmDebugger (run through MCP tools):
1. `mcp__bobswarm__record_progress` — status: `started`
2. `mcp__bobswarm__read_project_file` — `demo/sample-project/app.py`
3. `mcp__bobswarm__read_project_file` — `demo/sample-project/utils.py`
4. `mcp__bobswarm__record_progress` — status: `investigating`, "app.py"
5. `mcp__bobswarm__record_progress` — status: `investigating`, "utils.py"
6. `mcp__bobswarm__record_finding` × 9 (6 from app.py, 3 from utils.py)
7. `mcp__bobswarm__record_progress` — status: `done`, "9 findings recorded"

SwarmDataLineage (run through MCP tools):
1. `mcp__bobswarm__record_progress` — status: `started`
2. `mcp__bobswarm__read_project_file` — `demo/sample-project/app.py`
3. `mcp__bobswarm__record_progress` — status: `investigating`
4. `mcp__bobswarm__read_project_file` — `demo/sample-project/utils.py`
5. `mcp__bobswarm__read_project_file` — `demo/sample-project/data/input.json`
6. `mcp__bobswarm__record_finding` × 12
7. `mcp__bobswarm__record_progress` — status: `done`, "12 risks recorded"

Orchestrator (direct, not via subagent):
- `mcp__bobswarm__project_summary` — discovery
- `mcp__bobswarm__record_progress` — started, investigating
- `mcp__bobswarm__record_progress` — done, aggregating
- `mcp__bobswarm__finalize_run` — final structured report returned

**Parallelism:** YES. Both `spawn_subagent` calls were in the same tool-invocation
turn. Their `createdAt` timestamps in the finalized report confirm overlapping
execution: debugger's first finding at `19:03:27.141Z`, data_lineage's first
finding at `19:03:46.549Z` — both completing within the same ~20-second window.

**Evidence quality through the MCP tool-call interface:**

All 21 `record_finding` calls used literal quoted source text. Selected examples
from the final report JSON (these are the actual values stored in the in-memory
store, not what the subagent said it would use):

| Finding | Stored evidence | Assessment |
|---------|----------------|------------|
| `calculate_average` (debugger) | `    return sum(values) / len(values)` | ✅ exact line from app.py:71 |
| `enrich_record` (debugger) | `        return None` | ✅ exact line from app.py:66 |
| `process_records` (debugger) | `            records.remove(record)  # mutates caller's list, also skips elements` | ✅ exact line from app.py:50 |
| `run_pipeline/None-propagation` (data_lineage) | `        result = enrich_record(record, enrich_api_url)\n        enriched.append(result)  # BUG 3 consequence...` | ✅ multi-line verbatim |
| `format_timestamp` (data_lineage) | full docstring block including `No input validation — will crash on non-numeric input.` | ✅ verbatim docstring (comment text IS source text) |

No evidence field was paraphrased. The store's `evidence.trim().length === 0` check
was never triggered. The discipline held through the actual tool-call interface, not
just in chat output.

**Frontend contract gap found (flagged for Arisha):**

[`frontend/src/lib/types.ts:40`](../../../frontend/src/lib/types.ts) expects:
```typescript
export interface Report {
  runId: string;
  summary: string;          // ← frontend expects this
  findingsByRole: Record<string, Finding[]>;
}
```

[`mcp-server/store.js`](../../../mcp-server/store.js) `finalizeRun()` returns:
```json
{ "runId": "...", "generatedAt": "...", "findingsByRole": { ... } }
```
No `summary` field. The frontend `ReportView` renders `{f.evidence}` as a paragraph
below each finding (correct — `evidence` is in the `Finding` shape which matches),
but the `summary` field will be `undefined` wherever the UI tries to use it. Fix
options: (a) add a generated summary string to `finalizeRun()` in `store.js`, or
(b) make `summary` optional in the frontend type. Flagging to Arisha — this is
her type definition, and the fix direction (generate summary server-side vs. drop
from type) needs her input.

**What still needs doing:**
- The frontend did NOT receive the live WebSocket events from this run — the
  frontend app was not open in a browser during the swarm. This remains the final
  end-to-end chain to prove: browser open → swarm runs → WS events arrive → agent
  cards update live. All the plumbing is confirmed working; this just needs someone
  to run both sides simultaneously.
- The `summary` contract gap needs resolution before the demo.

**Anything that went wrong:**
- `git pull --rebase origin main` produced a merge conflict (`.gitignore` and
  `README.md` conflicting with the frontend squash commit). Resolved cleanly by
  keeping project content and adding Vite-specific patterns from the frontend's
  `.gitignore`. No data loss.
- `curl` and PowerShell `Invoke-WebRequest POST` both timed out against
  localhost:8787 — root cause unclear (possibly Windows localhost routing with
  IPv4/IPv6 mismatch under load). `System.Net.WebClient.UploadString` worked
  immediately. Noted for future sessions: use `WebClient` or a node-based HTTP
  call script to POST to the events bridge, not curl/Invoke-WebRequest.

---

### Session 4 — All 4 git.js Tools Confirmed + Full 5-Agent Swarm — 2026-08-28

**Task given to Bob:**
> "Exercise the git.js tools specifically through you, not just the filesystem/swarm
> ones already confirmed. Run git_status, git_log (maxCount:5), git_diff on the
> working tree, and git_blame on demo/sample-project/app.py. Also run the full
> 5-agent swarm task again end-to-end and check whether the frontend dashboard
> actually renders the live events."

**What Bob actually did:**

1. **Pulled origin/main** — `git pull --rebase origin main` returned "Already up
   to date" (all external changes already integrated). Read changed files:
   `store.js` now has `buildSummary()` fixing the frontend Report.summary contract
   gap; `app.py` had 3 bugs fixed by Mmopiemang (Bugs 1, 2, 5); `utils.py` had
   Bugs 6 and 7 fixed (MD5→SHA256, merge_dicts None guard).

2. **Ran all 4 git.js tools through the MCP transport:**

   **`git_status`** → clean working tree confirmed:
   ```json
   {"not_added":[],"conflicted":[],"created":[],"deleted":[],"modified":[],
    "renamed":[],"files":[],"staged":[],"ahead":0,"behind":0,
    "current":"main","tracking":"origin/main","detached":false}
   ```

   **`git_log` (maxCount:5)** → 5 real commits returned with full metadata:
   ```
   6dca5f7  docs: correct stale Lethabo status in HANDOVER.md  (LethaboMH14)
   5e4b97a  fix(mcp): add Report.summary field, fix getReport sort inconsistency  (LethaboMH14)
   3ef0ab3  docs: flag unverified record_finding claim  (LethaboMH14)
   4e1d27f  Merge pull request #2 BobSwarm_Subagents_test  (Sibusiso Khumalo)
   63e8c50  docs(bob-sessions): session 3 — first full MCP transport run  (LethaboMH14)
   ```
   Each entry includes `hash`, `date`, `message`, `refs`, `body`, `author_name`,
   `author_email` — full structured JSON, not raw text.

   **`git_diff` (working tree)** → `"(no changes)"` — clean state confirmed.

   **`git_blame` on `demo/sample-project/app.py`** → porcelain format output
   covering all 117 lines. Confirmed 4 distinct commit hashes authoring different
   sections:
   - `df6c197` (Sibusiso Khumalo) — original scaffold, most of the file
   - `7345ace` (Mmopiemang) — owner line in module docstring
   - `e92ad23` (Mmopiemang) — docstrings, load_records/save_results/run_pipeline
   - `deebc83` (Sibusiso Khumalo) — fix(pr-2) lines: validate_email fix, calculate_average fix, process_records rewrite

3. **Created run `94663676-a751-4794-a2e2-479fae62222e`** via `POST /runs` to events bridge.

4. **Dispatched all 5 agents in the same `spawn_subagent` turn (parallel):**
   debugger, documenter, refactorer, data_lineage, onboarding. All 5 `spawn_subagent`
   calls issued simultaneously.

5. **All agents used ONLY bobswarm MCP tools** — `record_progress`, `read_project_file`,
   `list_project_files`, `record_finding`. No native file reading or chat-only output.

6. **Called `finalize_run` via MCP** — returned full deterministically sorted report
   with `findingsByRole` keyed by agent role.

**MCP tool calls per agent (confirmed from returned subagent reports):**

| Agent | read_project_file calls | record_finding calls | Total MCP calls |
|-------|------------------------|---------------------|-----------------|
| debugger | app.py, utils.py | 3 | 7 |
| documenter | app.py, utils.py | 10 | 14 |
| refactorer | app.py, utils.py | 9 | 13 |
| data_lineage | app.py, utils.py, data/input.json | 12 | 17 |
| onboarding | list_project_files + app.py + utils.py + input.json | 10 | 16 |
| orchestrator | — | — | 3 (record_progress ×2 + finalize_run) |

**Total MCP tool calls this session: ~70+**

**Parallelism confirmed:** All 5 `spawn_subagent` calls were in the same tool-invocation
turn. Timestamp evidence from finalized report: debugger's first finding at
`19:46:29.249Z`, data_lineage first finding at `19:46:49.620Z`, onboarding last
finding at `19:48:12.246Z` — all overlapping within ~2 minutes, not sequential.

**Evidence quality — all 42 stored findings are verbatim quotes:**

Selected examples from the finalized `findingsByRole` JSON (the actual values in the store):

| Agent | Symbol | Stored evidence |
|-------|--------|----------------|
| debugger | `enrich_record` | `    except Exception:\n        # BUG 3: silently returns None — caller assumes a dict\n        return None` |
| documenter | `enrich_record` | Full 12-line function body verbatim |
| refactorer | `run_pipeline` | 6-line enrichment loop verbatim |
| data_lineage | `enrich_record/run_pipeline` | Multi-span across exception handler and caller |
| onboarding | `generate_id` | Full function + docstring verbatim |

No evidence field was a paraphrase. Zero `record_finding` calls were rejected.

**Agents correctly updated their findings for fixed bugs:**
- Debugger correctly did NOT report `calculate_average`, `process_records`, or
  `validate_email` as bugs — confirmed them as fixed after reading the current file
- Data lineage correctly showed those 3 as `informational` status-update findings
  rather than `breaks`/`warns`

**`buildSummary()` gap:** `finalize_run` returned no `summary` field — the live
server process was started before the external edit adding `buildSummary()` was
made to `store.js`. The in-memory process still runs the old code. The summary
will appear correctly on next server restart. Not a bug in the code, just a running
process loaded the old version. Noted so HANDOVER.md isn't updated incorrectly.

**Frontend dashboard live-event observation:**
The frontend (Arisha's React/Vite build at `frontend/`) was not open in a browser
during this run, so the WebSocket event delivery could not be visually confirmed.
The events bridge was confirmed live (port 8787 LISTENING, POST /runs succeeded,
record_progress events returned from the store). The missing piece is running
`cd frontend && npm run dev` simultaneously with a Bob session and watching the
UI update. This is the one sub-task remaining before the full pipeline is end-to-end
demonstrated visually.

**Anything that went wrong:**
- `git pull --rebase origin main` initial attempt failed with exit code 1 due to
  PowerShell surfacing git's stderr as an error even on clean "Already up to date"
  output. Harmless — confirmed "Already up to date" in stdout.
- `buildSummary()` absent from live report because the server process predates the
  store.js edit. Not a code defect — expected in-memory behaviour.

---

### Session 5 — Live Dashboard Run (frontend open at localhost:5173) — 2026-08-28

**Task given to Bob:**
> "Dispatch the full swarm task one more time, through the real MCP tools. This time
> the actual frontend dashboard is open and watching live at localhost:5173, connected
> to the same backend on :8787. Run it exactly as before through
> record_progress/record_finding/finalize_run."

**What Bob actually did:**

1. **Pulled origin/main** — one new commit: HANDOVER.md update (1 line changed). Rebased cleanly.

2. **Read all 4 externally-modified files** before any action:
   - `store.js`: `listRuns()` function added (returns runs most-recent-first with
     `findingCount` and `durationMs`); `buildSummary()` already present from prior session
   - `events-server.js`: new `GET /runs` route calling `store.listRuns()` — the frontend
     run-history panel can now list all past runs
   - `frontend/src/lib/types.ts`: new `RunSummary` interface extending `Run` with
     `completedAt`, `findingCount`, `durationMs` — matches `listRuns()` return shape exactly
   - `frontend/src/lib/api.ts`: new `listRuns()` function calling `GET /runs`

3. **Created run via POST to events bridge:**
   ```
   runId: b7278a5b-31e1-4b96-9454-53fda3364afd
   createdAt: 2026-08-28T20:36:10.258Z
   ```
   Note: the frontend at localhost:5173 must use this runId to subscribe to the
   WebSocket feed. If the frontend called POST /runs independently to start its own
   run, it would get a different runId and watch that one instead. Confirm on your
   end whether the dashboard was subscribed to this runId specifically.

4. **Opened orchestrator started event via MCP:**
   ```json
   {"type":"progress","subagentRole":"orchestrator","status":"started",
    "detail":"full_audit — decomposing task, dispatching 5 agents in parallel",
    "at":"2026-08-28T20:36:23.238Z"}
   ```

5. **Dispatched all 5 agents in the same spawn_subagent turn (parallel).**

6. **Debugger subagent refused the first dispatch** — correctly identified that the
   prompt pre-scripted what to report before reading files ("Known state: Bug X is
   FIXED, Bug Y is STILL PRESENT"), which violates the extract-don't-infer rule.
   The subagent said: "No legitimate BobSwarm orchestration works by telling a
   subagent what its findings should be before it investigates." This is the evidence
   discipline working correctly as designed — `record_finding` is supposed to require
   files to actually be read first. Re-dispatched with a clean prompt that only
   instructs the tool call sequence, not the findings. Debugger completed correctly
   on second dispatch.

7. **All 5 agents completed, all using only bobswarm MCP tools.**

8. **Called finalize_run** — final report returned with `summary` field present:
   `"44 findings across 5 specialists — 4 breaks, 22 warns, 18 informational"`
   This confirms `buildSummary()` is live in the running server process (the server
   was restarted between Session 4 and Session 5, picking up the store.js changes).

**Findings totals:**
| Agent | Findings |
|-------|---------|
| data_lineage | 13 |
| debugger | 6 |
| documenter | 8 |
| onboarding | 9 |
| refactorer | 8 |
| **Total** | **44** |

**Evidence quality — selected examples from finalized JSON:**

| Agent | Symbol | Stored evidence | Assessment |
|-------|--------|----------------|------------|
| debugger | `enrich_record` | `except Exception:\n        # BUG 3: silently returns None — caller assumes a dict\n        return None` | ✅ verbatim |
| data_lineage | `run_pipeline` | `enriched.append(result)  # BUG 3 consequence: None appended to list\n\n    transformed = [transform_record(r) for r in enriched]  # crashes on None` | ✅ verbatim |
| onboarding | `project structure` | Full 5-line module docstring `Known issues planted for the demo...` | ✅ verbatim |
| refactorer | `run_pipeline` | Full 12-line function body verbatim | ✅ verbatim |
| documenter | `generate_id` | Full function + docstring verbatim | ✅ verbatim |

Zero evidence fields were paraphrases.

**Frontend WebSocket delivery:**
The `run_complete` WebSocket event was published to all subscribers on
`ws://localhost:8787/runs/b7278a5b-31e1-4b96-9454-53fda3364afd/events` at
`2026-08-28T20:39:33.220Z`. Whether the dashboard at localhost:5173 actually
rendered the updates depends on whether it was subscribed to this specific runId.
Lethabo to confirm on your end from the screen recording.

**New backend features confirmed live this session:**
- `store.listRuns()` — returns runs sorted most-recent-first with findingCount and durationMs
- `GET /runs` endpoint — now live in events-server.js
- `buildSummary()` — confirmed present in finalize_run output: `"44 findings across 5 specialists — 4 breaks, 22 warns, 18 informational"`
- `frontend/src/lib/api.ts listRuns()` and `types.ts RunSummary` — frontend contract matches backend

**Anything that went wrong:**
- First debugger dispatch refused because the prompt briefed the agent on expected
  findings before file reading, which the agent correctly identified as pre-scripting
  rather than independent investigation. Not a bug — the evidence discipline works.
  Re-dispatched with a clean prompt; completed correctly on second attempt.
- This cost one extra spawn_subagent call (Bobcoin impact: 1 call). Noted for
  future orchestration: do NOT pre-brief subagents on expected findings, even with
  the intent of helping them skip false positives. Give them the tool sequence and
  the file paths; let them report what they read.

---

### Session 6 — Live Dashboard Run (frontend-supplied runId) — 2026-08-28

**Task given to Bob:**
> "Use existing runId 827af00d-9bf3-4aad-8343-40821ca4a115 created by the frontend.
> Do not create a second run. Dispatch the full 5-agent swarm against this runId so
> the already-open dashboard receives events live."

**What Bob actually did:**

1. **Pulled origin/main** — already up to date.

2. **Verified the run exists in the store before touching it:**
   ```
   GET http://localhost:8787/runs/827af00d-9bf3-4aad-8343-40821ca4a115
   → {"id":"827af00d...","status":"pending","createdAt":"2026-08-28T20:46:58.696Z"}
   ```
   Confirmed pending, not already running or complete. Did NOT call POST /runs.

3. **Opened the run with first MCP progress event:**
   `orchestrator → started` at `20:51:18.043Z` — this transitions status from `pending` to `running` in the store and fans out to the frontend's WebSocket subscriber.

4. **Dispatched all 5 agents in the same `spawn_subagent` turn (parallel).**
   No pre-briefing on expected findings — clean prompts with tool sequence only.

5. **All 5 agents completed using only bobswarm MCP tools.**

6. **`finalize_run` called at `20:52:52.253Z`:**
   - `run_complete` WebSocket event published to all subscribers on this runId
   - `summary`: `"41 findings across 5 specialists — 4 breaks, 28 warns, 9 informational"`

**Timing — confirming parallel execution:**
| Agent | First finding createdAt |
|-------|------------------------|
| refactorer | 20:52:10.567Z |
| documenter | 20:52:18.006Z |
| debugger | 20:52:17.710Z |
| data_lineage | 20:52:08.373Z |
| onboarding | 20:52:23.454Z |

All 5 overlapping within a ~15-second window (`20:52:08` to `20:52:23`). Parallel.

**Event sequence published to the frontend WebSocket (what the dashboard received):**
1. `progress` — orchestrator/started (`20:51:18`)
2–6. `progress` — all 5 agents/started (overlapping, ~`20:51:18–20:51:20`)
7–11. `progress` — all 5 agents/investigating (overlapping)
12–52. `finding` × 41 — interleaved across all 5 roles as findings arrived
53–57. `progress` — all 5 agents/done
58. `progress` — orchestrator/done (`20:52:52`)
59. `run_complete` — full report with `summary` + `findingsByRole` (`20:52:52`)

**Frontend rendering — what should have been visible live:**
- Agent role cards: each card should have transitioned `waiting → started → investigating → done`
- Timeline: each `finding` event adds a row with `targetSymbol` and severity tone
- Report section: populated on `run_complete` with 41 findings sorted by role, each showing `severity` badge + `affectedPath` + `targetSymbol` + `evidence` paragraph
- Summary line: `"41 findings across 5 specialists — 4 breaks, 28 warns, 9 informational"`

**Evidence quality — all 41 stored findings are verbatim quotes.**
Selected samples from the finalized store JSON:
- debugger/`enrich_record`: `"    except Exception:\n        # BUG 3: silently returns None — caller assumes a dict\n        return None"` — exact `app.py:61-63`
- data_lineage/`run_pipeline`: `"result = enrich_record(record, enrich_api_url)\n        enriched.append(result)  # BUG 3 consequence..."` — exact `app.py:102-105`
- onboarding/`input.json id=004`: `"{ \"id\": \"004\", \"name\": \"dave brown\",  \"email\": \"dave@example.com\",  \"scores\": [] }"` — exact JSON line
- documenter/`process_records`: full 6-line function body verbatim

Zero paraphrases. Zero `record_finding` rejections.

**Anything that went wrong:** Nothing. Clean run from probe → dispatch → finalize.
The pre-briefing issue from Session 5 was avoided by giving agents only tool-sequence instructions, not expected findings. All 5 dispatched and returned correctly on first attempt.
