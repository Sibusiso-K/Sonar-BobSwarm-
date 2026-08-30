# Launch Guide — Run the Golden BobSwarm Demo

This is the submission-day runbook. Follow it from a clean checkout before
recording. The operator handoff between the dashboard and Bob is an explicit
part of the proof of concept.

## Requirements

- IBM Bob 2.0 with Agent mode and subagents available.
- Node.js `^20.19.0` or `>=22.12.0`.
- Python 3.10+ for fixture validation.
- Two terminals plus the Bob and browser windows.

## First-time setup

```bash
git clone https://github.com/Sibusiso-K/Sonar-BobSwarm-.git
cd Sonar-BobSwarm-
npm --prefix mcp-server ci
npm --prefix frontend ci
```

Copy `.bob/mcp.json.example` to `.bob/mcp.json`. Replace the placeholder `cwd`
with the absolute path to this clone. Reopen the workspace in Bob and confirm
that Settings → MCP shows `bobswarm` as connected.

Never commit `.bob/mcp.json`; its absolute path is machine-specific.

## Verify before launching

```bash
npm run verify
```

If Python is not on `PATH`, set `BOBSWARM_PYTHON` to its executable first.
The verification command covers the orchestrator, demo fixture, Python
regressions, backend lifecycle/reconnect/path-boundary tests, frontend lint,
frontend tests, and production build.

The demo-only preflight is also available as:

```text
Windows:  powershell -ExecutionPolicy Bypass -File demo/run_demo.ps1
POSIX:    bash demo/run_demo.sh
```

## Start the services

Terminal 1:

```bash
npm --prefix mcp-server start
```

Terminal 2:

```bash
npm --prefix frontend run dev
```

Open `http://localhost:5173`. The backend binds to
`http://127.0.0.1:8787`. Verify `http://127.0.0.1:8787/health` returns a JSON
response with `"status":"ok"`.

Then run the judge-day operational check:

```bash
npm run demo:preflight
```

It verifies the local Bob MCP path, backend, frontend, run-history cleanliness,
Git state, and each member's root submission evidence. Runtime failures block a
recording; evidence and stale-history gaps are reported as warnings so they can
be closed deliberately.

## Run the live workflow

1. In the dashboard, click **Load sample audit** to populate the exact golden
   task, repository, and task type, then submit:

   > Audit `demo/sample-project` end to end. Find defects, document the public
   > API, recommend safe refactoring, trace the data flow, and produce an
   > onboarding guide.

2. The dashboard creates a pending run and displays a **Send the run to Bob**
   panel. Click **Copy Bob handoff prompt**. The copied prompt contains the
   complete UUID, task, task type, repository, dependency rule, and MCP
   evidence contract.
3. Switch Bob to **BobSwarm Orchestrator**, paste the prompt, and submit it.
4. Keep the dashboard visible. It should move through:
   `pending → running → complete`, with four independent roles in the first
   wave and the Refactorer after the Debugger when both are selected.
5. Confirm the unified report displays the deterministic summary, severity,
   file/symbol, and monospace literal evidence.

The dashboard creates and observes the run. Bob performs the orchestration.
They communicate through the shared UUID and MCP event store; the browser does
not call `spawn_subagent`.

## What to capture in the final video

- BobSwarm mode and connected MCP panel.
- The dashboard task submission and generated full run ID.
- The exact handoff pasted into Bob.
- Multiple `spawn_subagent` calls issued in the same dispatch wave.
- Live role cards and interleaved findings.
- The dependent Refactorer receiving Debugger context.
- Final summary, duration, severity counts, and literal evidence.

Use the timed storyboard in `docs/SUBMISSION_PACKAGE.md`; judges require at
least 90 seconds of narrated live demonstration and stop watching after three
minutes.

## Troubleshooting

### Backend cannot bind port 8787

Identify the exact process listening on the port before stopping it. If it is a
stale `node mcp-server/server.js`, stop that process and restart. If Bob owns the
active MCP process, reconnect from Bob's MCP panel instead of terminating Bob.

The MCP stdio tools remain available when the HTTP bridge cannot bind, but the
dashboard will not receive events until the port is free.

### Dashboard says BobSwarm is offline

Confirm the backend terminal is running current code and that
`GET http://127.0.0.1:8787/health` succeeds. The dashboard defaults to port
8787. For another port, set the same backend port and
`VITE_BOBSWARM_API=http://127.0.0.1:<port>` for the frontend.

### Run remains pending

Pending means the dashboard created the run but Bob has not published progress
or a finding. Copy the handoff again, confirm the full UUID was not shortened,
and submit it in BobSwarm Orchestrator mode. Pending runs eventually enter the
terminal `error` state instead of hanging indefinitely.

### Connection drops during a run

The frontend reconnects with the last event sequence it applied. The server
returns an authoritative snapshot, latest role states, partial/final report,
and any replayable events. The timeline may say older activity was condensed,
but findings and role states recover from the snapshot.

### A report read appears to complete a run

Restart the backend; an obsolete server process is still loaded. In current
code, `get_run_report` and `GET /runs/:id/report` are side-effect-free. Only
`finalize_run` transitions a running run to complete.

### Bob cannot access a project path

All Git and filesystem operations must stay under `BOBSWARM_ALLOWED_ROOT`,
which defaults to this repository. The backend resolves symlinks and Windows
junctions intentionally; links outside the allowed root are rejected.

## Submission freeze

After the final run:

1. Save/export the Bob report and capture every required screenshot.
2. Confirm the video sharing link in a private browser.
3. Confirm the public repository contains the final commit and no credentials.
4. Submit before the team's 12:00 SAST internal target.
5. Do not enhance or modify the submitted entry after the official deadline.
