# Launch Guide — How to Run BobSwarm Locally

> **For everyone on the team.** Follow this in order. If something breaks,
> check "Troubleshooting" below before asking in chat — most problems hit so
> far are already diagnosed here with the exact fix.
>
> Written 2026-08-28, ~23:23 SAST, after the first fully-verified live
> end-to-end run (real Bob MCP session → real backend → real frontend,
> watched together).

---

## 1. First-time setup (once per machine)

```bash
git clone https://github.com/Sibusiso-K/Sonar-BobSwarm-.git
cd Sonar-BobSwarm-

# Backend
cd mcp-server && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..

# Bob MCP registration — machine-specific, not committed (see docs/CRITICAL_DECISIONS.md §5a)
cp .bob/mcp.json.example .bob/mcp.json
# then edit .bob/mcp.json: replace the placeholder cwd with the absolute
# path to YOUR local clone of this repo
```

## 2. Every time you want to run it

**Order matters — backend first, always.**

```bash
# Terminal 1 — backend (MCP stdio server + events bridge on :8787)
cd mcp-server
node server.js

# Terminal 2 — frontend (Vite dev server on :5173)
cd frontend
npm run dev
```

Open `http://localhost:5173`. The frontend expects the backend at
`http://localhost:8787` by default (override with a `.env.local` containing
`VITE_BOBSWARM_API=http://...` if needed — never commit this file, it's
already gitignored).

**For Bob to use the MCP tools:** open this project folder in Bob. With
`.bob/mcp.json` present (step 1 above), Bob should register the `bobswarm`
server automatically. Check Settings → MCP tab — status should show
**Connected** (green), not Disconnected.

## 3. Confirming everything is actually connected, not just running

Three independent things need to be true at once for a full live demo:

1. **Backend is up** — `curl http://localhost:8787/runs` returns `[]` or a
   list, not a connection error.
2. **Bob's MCP panel shows `bobswarm` Connected** — not just that
   `node server.js` is running in a terminal; Bob has to have successfully
   attached to it.
3. **The frontend is subscribed to the same run Bob is using** — see
   "The runId bridging step" below. This is the one non-obvious part.

---

## 2a. The runId bridging step — read this before trying a full live demo

This is the single most important thing learned from the first real
end-to-end test, and it is **not obvious from the code**:

**The frontend and Bob each create their own run by default, and they don't
know about each other's.** If you type a task into the frontend AND
separately paste a task into Bob, you get two different runs with two
different IDs — the frontend watches its own, Bob populates its own, and
you see nothing live even though both sides are individually working
correctly.

**The fix (no code change needed — `record_progress`/`record_finding`/
`finalize_run` already take an explicit `runId`):**

1. Submit the task through the **frontend form first**. It creates the real
   run and immediately subscribes to it — the page will show
   `run <8-char-id> · open`.
2. Get the **full** run ID (not the truncated 8 characters shown in the UI)
   — currently the only way is via browser dev tools → Network tab → find
   the `POST /runs` request → read the full `id` from the response body.
   (Flagged to Arisha as a polish item: a "copy full run ID" button would
   remove this friction.)
3. Give Bob the task **plus an explicit instruction to use that exact
   `runId`** for every tool call, instead of creating its own. Example
   phrasing that worked:
   > "Use runId: `<full-uuid>` for every record_progress/record_finding/
   > finalize_run call — this run already exists, don't create a new one."
4. Now the dashboard you already have open will receive the real events
   live.

**Without step 2-3, everything still works — you just won't see it live.**
The run still completes correctly and `GET /runs/:id/report` still returns
the full result; you're just watching the wrong (or no) run in the browser.
For the actual demo recording, this bridging step is required.

---

## Troubleshooting

### Bob's MCP panel shows "Disconnected"

Most common cause, in order of likelihood:

1. **A stray process is already holding port 8787.** This has happened
   multiple times during development — an old test process didn't fully
   terminate. Check:
   ```bash
   netstat -ano | grep ":8787"
   ```
   If something's listed, identify it before killing anything:
   ```bash
   # Windows
   wmic process where "ProcessId=<PID>" get ProcessId,ParentProcessId,CommandLine
   ```
   If the parent process is `IBM Bob.exe`, **do not kill it** — that's
   Bob's own live connection working correctly. If it's an orphaned `node`
   process from earlier testing, kill it and reconnect from Bob's MCP panel
   (Settings → MCP tab → refresh icon).

2. **Bob spawned the server before a recent code change landed on disk.**
   Node doesn't hot-reload — if `mcp-server/` files changed after Bob's
   session started, Bob is running stale code. Reconnect/restart the MCP
   server from Bob's panel to pick up current code. (You can check whether
   this is the issue: compare the running process's start time against the
   files' last-modified time — `wmic process where "ProcessId=<PID>" get
   CreationDate` vs `ls -la --time-style=full-iso mcp-server/*.js`.)

3. **`.bob/mcp.json` doesn't exist or has the wrong path** — see step 1 of
   first-time setup. This file is gitignored on purpose (machine-specific
   `cwd`); if you just cloned, you need to create it from the `.example`.

### Frontend shows "Can't reach the BobSwarm events server"

The backend (`node mcp-server/server.js`) isn't running, or isn't running
on the port the frontend expects. This is the connection working
correctly and reporting a real failure — **not** a sign the frontend needs
rewiring. Start the backend (see step 2 above) and reload.

### `EADDRINUSE` / port 8787 already in use when starting the backend

A previous instance (yours or a stray test process) is still holding the
port. As of the port-conflict-resilience fix, `server.js` itself won't
crash from this anymore — the MCP stdio connection to Bob still works even
if the events bridge can't bind — but the frontend won't get live events
until the port is freed. Find and stop whatever's holding it (see MCP
Disconnected → cause 1 above), or set `BOBSWARM_EVENTS_PORT` to a free port
on both the backend (`BOBSWARM_EVENTS_PORT=8799 node server.js`) and the
frontend (`.env.local`: `VITE_BOBSWARM_API=http://localhost:8799`).

### Run history panel shows `{"error":"not found"}`

The running backend process predates the `GET /runs` endpoint (added after
it started — same stale-process issue as above). Restart the backend
(`node server.js` again) and it resolves immediately — the code itself is
correct, it's a running-process staleness issue, not a bug.

### A subagent's findings look paraphrased instead of literal quotes

This is enforced two ways, not one — worth knowing which layer caught it:
- `mcp-server/store.js`'s `recordFinding` rejects **empty** evidence outright
  (a hard code-level check).
- Whether evidence is a **literal quote vs. a paraphrase** is enforced by
  the persona wording in `agents/*.md`, not by the server — the server has
  no way to verify a string is "really" from the source file. If you see a
  paraphrased finding, that's a persona-wording issue (Farheen's area), not
  a backend bug.

### Git push rejected ("fetch first" / non-fast-forward)

Someone else pushed while you were working — normal on an active team repo.
```bash
git pull --rebase origin main
# resolve any conflicts if prompted
git push origin <branch>
```
Never force-push to `main`.

---

## What's actually verified working, as of this writing

- All 12 MCP tools (`git_status`, `git_log`, `git_diff`, `git_blame`,
  `list_project_files`, `read_project_file`, `project_summary`,
  `write_swarm_report`, `record_progress`, `record_finding`, `finalize_run`,
  `get_run_report`) — confirmed live through Bob's real stdio transport,
  zero errors.
- Full 5-agent parallel swarm dispatch — confirmed via overlapping
  timestamps in stored findings, not just claimed.
- Literal-evidence discipline — checked character-for-character against
  source files, zero paraphrases found across two independent live runs.
- Frontend ↔ backend WebSocket — confirmed receiving real events live in
  the browser, not simulated.
- Run history + live elapsed timer — tested against real data.
- `decompose.js`'s keyword routing and confidence scoring (Farheen) — 14
  test cases, all correct.

## What's not yet done

- The runId-bridging step above is manual — no automatic link between "task
  typed into frontend" and "Bob picks it up." Fine for a driven demo, not
  production-ready automation.
- Frontend font loading is broken (fonts declared in CSS, never actually
  loaded — see `docs/ARISHA_FRONTEND_POLISH.md`) — Arisha's next task.
- Demo target (`demo/sample-project/`) has fewer live bugs than originally
  planted — see `docs/CRITICAL_DECISIONS.md` §5c, needs a team decision.
