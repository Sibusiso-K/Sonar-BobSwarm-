# Lethabo — Backend Full Handoff & Runbook

> **Purpose:** open this project folder in Bob and carry on from exactly where
> this left off, without needing anything from outside this repo. If something
> here is stale by the time you read it, trust the actual code over this doc
> and update this doc to match — same rule as `HANDOVER.md`.
>
> **Also read [`docs/BACKEND_CONCEPTS_AND_VALUE_PROP.md`](BACKEND_CONCEPTS_AND_VALUE_PROP.md)**
> — the *why* behind MCP, the API/filesystem/background-task design choices,
> two scoped "wow factor" ideas worth considering if time allows, the
> sharpened problem statement for D2/D3, and the git pull/push workflow this
> session should follow automatically (§7 there) — pull before starting,
> commit and push after each meaningful unit of work, not just at the end.
>
> Last updated: 2026-08-28, 19:24 SAST.

---

## 1. Where things stand right now

**Merged into `main`:**
- `mcp-server/tools/git.js`, `tools/filesystem.js` — original 8 tools (Sbu's
  scaffold, your ownership per `CONTRIBUTING.md`) — **written, not yet tested
  against a live Bob session.**
- `mcp-server/store.js`, `events-server.js`, `tools/swarm.js` — your additions.
  Store logic and HTTP endpoints are smoke-tested directly (curl + inline
  Node scripts). **Not yet exercised by a real Bob subagent making real tool
  calls** — that's the actual first point, see §7.
- `docs/RULES_SPEC.md`, `docs/CRITICAL_DECISIONS.md`, `docs/LIVE_EVENTS.md` —
  reference docs, already pushed.
- `HANDOVER.md` — shared team status doc (Sbu's), your section updated.

**Not yet done, in your area:**
- Live Bob session hasn't touched any MCP tool yet — everything's been tested
  outside Bob so far.
- No reconnect/retry logic on the frontend WebSocket side — noted as a gap
  in §5.
- `write_swarm_report` (old tool, writes markdown to disk) and `finalize_run`
  (your tool, returns structured JSON) now overlap — needs a decision, see §5.

---

## 2. System shape (as actually built, not the earlier planning-doc version)

```
Bob (Agent mode)
  ↕ stdio (MCP protocol)
mcp-server/server.js
  ├─ tools/git.js          (git_status, git_log, git_diff, git_blame)
  ├─ tools/filesystem.js   (list_project_files, read_project_file,
  │                         project_summary, write_swarm_report)
  └─ tools/swarm.js        (record_progress, record_finding,
                             finalize_run, get_run_report)
       ↓ writes to
     store.js (in-memory: runs, findings, subscribers)
       ↓ fans out to
     events-server.js (HTTP :8787 + WebSocket)
       ↕
     frontend/ (Arisha — browser, not yet wired to the real feed)
```

Two separate transports, on purpose: Bob only ever speaks MCP-over-stdio to
`server.js`. The browser can't attach to a stdio pipe, so `events-server.js`
is a side-channel HTTP+WS process that the MCP tools also write into. Both
run from the same `node server.js` process (see `server.js`'s `main()` —
it calls `startEventsServer()` alongside connecting the stdio transport).

---

## 3. Full tool contract (all tools currently registered)

| Tool | File | Args | Returns | Status |
|---|---|---|---|---|
| `git_status` | `tools/git.js` | `repoPath` | JSON status | untested live |
| `git_log` | `tools/git.js` | `repoPath`, `maxCount` | JSON commit array | untested live |
| `git_diff` | `tools/git.js` | `repoPath`, `from?`, `to?` | diff text | untested live |
| `git_blame` | `tools/git.js` | `repoPath`, `filePath` | blame text | untested live |
| `list_project_files` | `tools/filesystem.js` | `rootPath`, `pattern?`, `ignore?` | newline file list | untested live |
| `read_project_file` | `tools/filesystem.js` | `filePath`, `encoding?` | file content | untested live |
| `project_summary` | `tools/filesystem.js` | `rootPath` | JSON summary | untested live |
| `write_swarm_report` | `tools/filesystem.js` | `outputPath`, `content` | confirmation text | untested live |
| `record_progress` | `tools/swarm.js` | `runId`, `subagentRole`, `status`, `detail?` | JSON event | store-tested |
| `record_finding` | `tools/swarm.js` | `runId`, `subagentRole`, `targetSymbol`, `affectedPath`, `severity`, `evidence` | JSON finding | store-tested, evidence-required validated |
| `finalize_run` | `tools/swarm.js` | `runId` | JSON report (sorted, grouped) | store-tested |
| `get_run_report` | `tools/swarm.js` | `runId` | JSON report | store-tested |

**Note on `severity`:** must be exactly `"breaks"`, `"warns"`, or
`"informational"` — `store.js`'s `recordFinding` throws on anything else.
Farheen's persona files need to use these exact strings.

**Note on `evidence`:** must be a non-empty string. `store.js` throws if
empty/whitespace-only. This is deliberate — it's the extract-don't-infer rule
enforced in code, not just in the persona prompt wording. If a subagent has
nothing to quote, it should not call `record_finding` at all, not call it with
a placeholder.

---

## 4. Running it locally — full command reference

```bash
cd mcp-server
npm install                    # already verified clean, 0 vulnerabilities

# Full server (stdio MCP + events bridge together — this is what Bob connects to)
node server.js

# Events bridge only, for frontend dev without a Bob session attached
node events-server.js
# → http://localhost:8787  (override: BOBSWARM_EVENTS_PORT=9000 node events-server.js)

# Direct store logic test, no server needed
node -e "
const store = require('./store');
const run = store.createRun({ taskDescription: 't', taskType: 'schema_impact', repoRef: '/tmp' });
console.log(run);
"

# Direct MCP stdio smoke test (sends a tools/list request and exits)
# Useful to confirm server.js boots without errors before pointing Bob at it
node server.js <<< '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

**Health check for the events bridge:**
```bash
curl -s http://localhost:8787/runs/nonexistent-id
# Expect: {"error":"unknown run_id: nonexistent-id"} with HTTP 400 — this
# confirms the server is up and error handling works, without needing a real run.
```

---

## 5. Fallbacks and known gaps — read before you hit them

### 5a. Bob's MCP registration mechanism is still unconfirmed
This is the single biggest unknown (also flagged in `HANDOVER.md` and
`docs/CRITICAL_DECISIONS.md`). MCP is a standard protocol, so a reasonable
first guess for how Bob wants a stdio server registered is a JSON config
block shaped like:
```json
{
  "mcpServers": {
    "bobswarm": {
      "command": "node",
      "args": ["mcp-server/server.js"],
      "cwd": "/absolute/path/to/Sonar-BobSwarm-"
    }
  }
}
```
This is the same shape Claude Desktop/Claude Code use — worth trying first
since MCP itself is a shared spec, not IBM-specific. **If Bob's actual config
format differs, check Bob's own docs/settings UI for "MCP servers" or
"tools" before assuming this project's tool contract is wrong** — the tool
code itself doesn't need to change for a different registration mechanism.

**Fallback if Bob has no MCP registration UI at all, or it's broken:** the
orchestration doesn't strictly require MCP. Bob's Agent mode can call
`read_project_file`-equivalent actions using its own built-in file tools, and
subagents can report findings in a fixed markdown format in chat instead of
via `record_finding` — you'd lose live-event visibility on the dashboard, but
the swarm itself still runs and `write_swarm_report`'s markdown-to-disk path
becomes the primary report mechanism instead of a nice-to-have. Don't silently
fall back to this without telling Sibusiso — it changes what "Bob usage" looks
like in the D3 written statement.

### 5b. A Bob session hangs mid-run
`store.js`'s `armTimeout()` force-finalizes any run stuck in `running` after 5
minutes (`TIMEOUT_MS`), so the dashboard/report always eventually renders
something. If 5 minutes is wrong for the actual fixture repo size once
Mmopiemang's fixtures exist, change `TIMEOUT_MS` in `store.js` — it's the only
place that number lives.

### 5c. WebSocket drops mid-demo (not yet handled)
`events-server.js` doesn't currently push any "replay missed events on
reconnect" logic — if the browser's WS drops and reconnects, it just gets new
events from that point forward, not the run's full history. For the live demo
specifically, that's an acceptable risk (short runs, one continuous
recording). If Arisha wants reconnect-safe behavior, the cheap fix is: add a
`GET /runs/:id/events-so-far` endpoint that replays all findings/progress
recorded so far as a JSON array, and have the frontend call that once on
(re)connect before trusting live WS messages. Not built yet — flag to Arisha
if she needs it, don't build it speculatively before she asks.

### 5d. `write_swarm_report` vs. `finalize_run` — pick one path
Both exist right now. `write_swarm_report` (original scaffold, Sbu's design)
writes a markdown blob to disk, called manually by the orchestrator at the
end. `finalize_run` (yours) returns a structured JSON report, deterministically
sorted, live-pushed to the dashboard. Recommendation: keep both, but make
`finalize_run` the one Bob calls automatically (per `record_progress`
"done" x N → `finalize_run`), and have the orchestrator optionally call
`write_swarm_report` afterward with a rendered-to-markdown version of the same
report, for a human-readable artifact in the repo. Don't let the orchestration
constitution treat them as redundant alternatives — that's how you get an
inconsistent report between the dashboard and the markdown file.

### 5e. `npm install` fails inside Bob's environment (no network, sandboxed, etc.)
If Bob's execution environment can't reach the npm registry, the fallback is:
run `npm install` once from a machine that does have network access (this one
does — already verified), then commit `node_modules/` as a one-time exception
to `.gitignore` for the hackathon only (`git add -f mcp-server/node_modules`).
This is against normal practice but acceptable for a 48h PoC if it's the
difference between a working and non-working demo. Prefer confirming Bob's
sandbox has network access first — don't do this preemptively.

### 5f. Path traversal / untrusted file access
`read_project_file` and `list_project_files` currently take an arbitrary
`filePath`/`rootPath` with no boundary check — anything Bob (or a
compromised/confused subagent) passes gets read. For a hackathon demo against
your own fixture repos this is low-risk, but if there's time, add a resolved-
path prefix check (resolve the path, confirm it starts with the intended
project root) before the final submission — same reasoning as the original
Python design's path-traversal guard. Not done yet; not blocking.

### 5g. Git push conflicts
If a `git push` to `main` or a feature branch is rejected (someone else
pushed first):
```bash
git pull --rebase origin main   # or your feature branch
# resolve any conflicts, then:
git push origin <branch>
```
Never force-push to `main`. Force-pushing a feature branch you alone own is
fine if genuinely needed, but ask before doing it on anything Sbu or others
may have already pulled.

### 5h. Credential exposure
`.gitignore`/`.bobignore` (added in PR #1) already exclude `.env`, `*.pem`,
`*.key`. Before any commit that touches config, run `git status` and actually
look at what's staged — the rules are explicit that IBM Cloud credential
exposure can suspend the account immediately, and GitGuardian is already
running as a check on this repo (saw it pass on PR #1) but don't rely on it
as the only line of defense.

---

## 6. Repo, GitHub, and workflow reference

**Repo:** `https://github.com/Sibusiso-K/Sonar-BobSwarm-`, default branch `main`.

**Your local clone:** `C:\Users\USER\Desktop\IBM 2.0\bobswarm-repo` — this is
what to open as the project folder in Bob.

**Auth:** already configured on this machine — `gh auth status` shows logged
in as `LethaboMH14`, `repo` scope, HTTPS protocol. No further setup needed to
clone, push, or use `gh pr` commands.

**Team convention (`docs/CONTRIBUTING.md`, written by Sbu):**
- Branch naming: `feature/<your-name>/<short-description>` or
  `fix/<your-name>/<short-description>`.
- Commit format: `<type>(<scope>): <short description>` — types: `feat`,
  `fix`, `docs`, `refactor`, `test`, `chore`.
- "Before touching another team member's files, ping them first." Your owned
  area is `mcp-server/` — free to work there without asking. Anything in
  `frontend/`, `agents/`, `orchestrator/`, `.bob/` belongs to someone else —
  flag needed changes there rather than editing directly, same as the
  `docs/LIVE_EVENTS.md` approach (wrote the contract, didn't touch
  `frontend/app.js`).
- Root-level shared files (`README.md`, `HANDOVER.md`) — edited directly when
  the change is small, transparent, and doesn't override someone else's
  content without explanation (see the Swarm_Corp README fix in PR #1 — made
  the edit, explained why in the PR description and in
  `docs/CRITICAL_DECISIONS.md`, rather than silently changing it).

**Observed workflow so far (worked example, PR #1):**
```bash
git checkout -b feature/lethabo/<description>
# make changes
git add <specific files>            # never a blanket git add -A/. in this repo
git commit -m "feat(mcp): ..."
git push -u origin feature/lethabo/<description>
gh pr create --title "..." --body "..."
# check before merging:
gh pr view <number> --json mergeable,mergeStateStatus,statusCheckRollup,reviews
gh pr merge <number> --merge --delete-branch
```
For small, non-conflicting doc-only updates to shared files you already have
context on (like the `HANDOVER.md` status update after PR #1), pushing
directly to `main` is consistent with how Sbu himself used the repo — no need
to open a PR for every single change, use judgement on size/risk.

**Deadline constraints that affect how you work the repo (full detail in
`docs/CRITICAL_DECISIONS.md`):**
- Target final submission: **12:00 SAST Sunday 30 Aug**. Hard deadline
  16:00 SAST same day.
- **No commits after 16:00 SAST Sunday** — treat the submission as frozen
  before that, not at it.
- Every team member needs their own Bob task-session screenshots — start
  saving yours into `docs/bob-sessions/lethabo/` as you go, not at the end.

---

## 7. The first point — what to actually do when you open Bob

In order:

1. **Confirm Bob can see this project folder and its MCP config options.**
   Open Bob pointed at `C:\Users\USER\Desktop\IBM 2.0\bobswarm-repo`. Look for
   an MCP/tools/servers setting. This resolves the biggest unknown in §5a —
   report back what you find (even "there's no such setting, only X") so
   `docs/CRITICAL_DECISIONS.md` can be updated with a real answer instead of
   a guess.

2. **Register/start the MCP server** using whatever mechanism Bob actually
   exposes (§5a), pointing at `mcp-server/server.js`.

3. **Verify the tool list loads.** Bob's Agent mode should be able to see
   `git_status`, `list_project_files`, `record_finding`, etc. as available
   tools. If it can't see them, that's a registration problem, not a code
   problem — the tools themselves are already verified working outside Bob.

4. **Run one tool manually from inside Bob** — ask Bob (in whatever mode lets
   it call tools directly) to run `project_summary` against
   `demo/sample-project`. Confirm the JSON comes back correctly formatted.

5. **Switch to BobSwarm Orchestrator custom mode** (`.bob/custom_modes.yaml`,
   Sbu's) and give it a real task, e.g.:
   > "Analyse demo/sample-project for bugs and trace how data flows through it."

6. **Watch what actually happens** — does it call `record_progress`/
   `record_finding`, or just respond in chat? This is exactly the thing
   Sibusiso's epic (T2, iterate the constitution) and Farheen's epic (T2,
   iterate persona wording) depend on seeing. Report back concretely: which
   tools got called, in what order, and whether findings had real evidence
   quotes or were paraphrased despite the instructions.

7. **Once tool-calling is confirmed working:** open
   `http://localhost:8787/runs` flow in a second terminal/browser tab (or via
   curl) to confirm the events bridge is receiving the same calls live — this
   proves the full chain end to end, which is the hour-10 checkpoint from the
   original SDLC plan, now happening from your side specifically.

If step 1 or 2 reveals Bob's actual mechanism is completely different from
the guessed config in §5a, don't guess further — that's the moment to update
this doc and `docs/CRITICAL_DECISIONS.md` with the real answer and keep going,
not stop and wait.
