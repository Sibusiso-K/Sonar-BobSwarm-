# BobSwarm Current-State Review

> Historical review retained for auditability. The authoritative current
> status is the integration baseline at the top of `HANDOVER.md`; older notes
> about missing snapshots and the dashboard handoff UI have been superseded by
> the current implementation. Remaining evidence gaps are still intentionally
> listed below.

**Prepared for:** Sibusiso — Lead / Orchestrator  
**Review date:** 29 August 2026  
**Reviewed branch:** `main`  
**Reviewed commit:** `158a075` — `docs: mark demo bug-count decision resolved`  
**Remote state:** Local `main` was fast-forwarded and is synchronized with `origin/main`.

## Executive assessment

BobSwarm is a credible, demo-capable hackathon project with a real React dashboard, a real MCP server, five specialist personas, recorded parallel Bob sessions, and evidence-backed reports. The team has demonstrated the individual pieces and has run the complete five-agent workflow manually.

The project is not yet an autonomous end-to-end product. Clicking **Dispatch the swarm** creates an in-memory run and opens a WebSocket, but no repository code invokes IBM Bob or `spawn_subagent`. A human must copy the generated run ID into a separate Bob Orchestrator prompt. That manual bridge is acceptable for a controlled demo if described honestly, but it is the largest gap between the product claim and the implementation.

The immediate risk is now submission readiness rather than feature volume. Required screenshots and usage statements are incomplete, the launch/handover documentation contains stale claims, and the local backend process currently serving port 8787 predates recent API changes. The safest path is to stabilize and record the existing manual workflow before making broad architectural changes.

## Verified baseline

| Area | Result |
|---|---|
| Git | `main` synchronized with `origin/main` at `158a075`; working tree clean |
| Frontend build | Pass — TypeScript and Vite production build completed |
| Frontend lint | Pass with one warning in `SwarmField.tsx` about mutating the seeded random variable |
| Frontend live rendering | Pass — dashboard rendered correctly; fonts, asymmetric hero, auto-scroll, conditional stages, and copy-run-ID control are present |
| Python tests | Pass — 4 tests passed |
| Backend syntax | Pass — all MCP/event/store JavaScript files passed Node syntax checks |
| Decomposition harness | Executes all 14 examples, but is not a reliable automated test suite |
| Dependency audit | Pass — zero reported vulnerabilities in frontend and MCP packages |
| Demo script | Not runnable on this machine: `bash` resolves to WSL and no distribution is installed |
| Live port 8787 | Occupied by a Node process started 28 August; its `GET /runs` returns 404 and it must be restarted before the demo |

---

# Individual Team Reviews

## 1. Sibusiso — Lead / Orchestrator

### What is genuinely complete

- The project mode is registered in `.bob/custom_modes.yaml`.
- The `bobswarm` skill describes decomposition, persona loading, parallel dispatch, and aggregation.
- `orchestrator/system_prompt.md` defines a clear five-step orchestration protocol and unified report format.
- A full five-agent run was recorded, including four parallel agents and a sequential Refactorer.
- Your Bob usage statement paragraph is present.
- The unified report from your session is saved under `docs/bob-sessions/sibusiso/`.

### Problems in your owned section

1. **The run-opening protocol is impossible as written.** `system_prompt.md` says to create a run by calling `record_progress`, but `record_progress` requires an already-existing run ID and throws for an unknown run. There is no `create_run` MCP tool. In practice, the frontend must first call `POST /runs`, and the UUID must be copied to Bob manually.

2. **The skill and system prompt are out of sync.** The system prompt requires every subagent to call `record_progress` and `record_finding`, but the skill's dispatch example passes only the persona and task. None of the five persona files includes the MCP lifecycle instructions. Successful recorded sessions worked because those instructions were supplied manually; the default skill path does not guarantee them.

3. **The orchestration example is ambiguous about the Refactorer.** It appears beside the parallel dispatch examples even though the surrounding rules say it must wait for Debugger findings when both are selected.

4. **Submission evidence is incomplete.** Your session folder contains the report and contribution log but no screenshots. The handover explicitly lists the missing green MCP-panel screenshot.

### Your current status

**Status: Demo-proven, protocol needs correction.** Your orchestration concept works when you actively conduct the run. It is not yet a self-contained protocol another operator can follow without knowing the manual run-ID workaround.

### Recommended actions for you

1. Own the final demo run and use the manual run-ID procedure deliberately.
2. Correct the system prompt so Step 3 begins with an existing frontend-created `runId`, or add a real `create_run` MCP tool after the submission-critical work is safe.
3. Add explicit MCP instructions to every dispatched subagent payload.
4. Capture your required Bob/MCP screenshots.
5. Drive completion of the three missing team usage statements and final submission artifacts.

## 2. Lethabo — Backend Engineer

### What is genuinely complete

- The MCP server starts over stdio and registers Git, filesystem, and swarm tools.
- All 12 documented tools exist and were recorded as live-tested through Bob.
- The HTTP/WebSocket event bridge, run store, deterministic aggregation, history endpoint, and summary generation are implemented.
- The local `.bob/mcp.json` exists and points to the correct checkout.
- Two Bob session screenshots and a detailed multi-session contribution log are present.
- Current npm audit reports zero vulnerabilities.

### Problems in the backend section

1. **`get_run_report` mutates the run.** The tool claims to fetch a report without finalizing, but `store.getReport()` calls `finalizeRun()` for any incomplete run. A probe confirmed that a pending run becomes complete with zero findings, while later findings are still accepted.

2. **Lifecycle transitions are not enforced.** Progress and findings can be recorded after completion, and repeated finalization changes `completedAt` and can emit multiple completion events.

3. **WebSocket delivery is lossy.** Events are sent only to currently connected subscribers. There is no replay buffer or initial snapshot, and the frontend does not reconcile through HTTP after reconnecting. Early events, disconnects, or a fast completion can permanently produce an incomplete dashboard.

4. **Pending runs never time out.** The timeout only finalizes runs already marked `running`. A frontend-created run that never receives Bob progress remains pending indefinitely.

5. **The filesystem root guard is only lexical.** A symlink or Windows junction inside the allowed root can point outside it; subsequent reads and writes follow the link. Real paths and write-parent paths need validation.

6. **The Node support declaration is inaccurate.** `mcp-server/package.json` permits Node 18, while `glob@11` requires Node 20 or at least 22. The root `.gitignore` also ignores all `package-lock.json` files, leaving MCP dependency resolution non-reproducible.

7. **There is no automated backend test suite.** Important behavior is evidenced in contribution logs and ad hoc probes, not repeatable tests.

8. **The active backend is stale.** Port 8787 is held by a Node `mcp-server/server.js` process started on 28 August. It returns 404 for `GET /runs`, indicating it loaded code before the current history route. Restart it before any recording.

### Documentation/evidence status

- The handover's open item claiming Git tools were not live-tested conflicts with the status table and later session evidence saying all four were confirmed.
- Lethabo's required Bob usage statement paragraph is still blank.
- Screenshots are present.

### Current status

**Status: Strong demo backend, weak lifecycle guarantees and automated coverage.** It can support the controlled demo, but it should not be presented as resilient or production-ready.

## 3. Arisha — Frontend Engineer

### What is genuinely complete

- React 19, TypeScript, Vite, Tailwind, motion, and icon integration are present.
- The frontend production build passes.
- The dashboard rendered successfully during live browser review.
- Google Fonts are now loaded correctly.
- The redesigned hero and evidence-focused wording are implemented.
- Stage 2 and Stage 3 remain hidden until a run exists.
- Dispatch auto-scrolls to the swarm section.
- A full run-ID copy button is present.
- Real REST and WebSocket clients exist; live events were recorded in prior sessions.
- Run history and live elapsed time are implemented.

### Problems in the frontend section

1. **Dispatch does not dispatch Bob.** The UI creates a pending run and subscribes, then waits. During live review it displayed the run ID and five waiting agents, exactly as expected from the manual bridge.

2. **There is no reconnect or state recovery.** Socket close/error changes only the connection label. It does not fetch the current run or report, reconnect, or re-enable the form.

3. **Backend/frontend statuses disagree.** The backend creates `pending`; frontend types and history styles expect `queued`. The mismatch is hidden by TypeScript casts and yields an unstyled/unknown history state.

4. **Backend error bodies are shown raw.** With the stale port-8787 process, history displayed `{"error":"not found"}` directly in the page.

5. **A completed zero-finding report still renders no explicit clean state.** Evidence remains paragraph-styled rather than code-styled, and severity mainly changes badge color.

6. **Lint is not fully clean.** `SwarmField.tsx` mutates a seeded variable inside a memo callback, producing the React immutability warning.

### Branch and documentation status

- `origin/add-react-frontend` is not an ancestor of `main` and contains the original `frontend-react/` work. Its functionality was imported into `frontend/` through the later subtree workflow and then polished. The branch should be compared once and archived rather than merged wholesale.
- `HANDOVER.md`, `LAUNCH_GUIDE.md`, and `ARISHA_FRONTEND_POLISH.md` still describe fonts, hero layout, empty-state stacking, auto-scroll, and copy-run-ID as unfinished even though those items are implemented.
- Arisha's session folder has no screenshots or contribution log.
- Arisha's Bob usage statement paragraph is blank.

### Current status

**Status: Visually strong and build-clean, but dependent on a manual orchestration handoff and fragile event connection.**

## 4. Farheen — AI/ML Engineer

### What is genuinely complete

- Five specialist persona files exist with clear roles, protocols, output formats, and anti-patterns.
- `decompose.js` maps plain-language requests to all five roles.
- The Debugger-to-Refactorer dependency is represented correctly in returned task metadata.
- Fourteen representative requests execute and route to plausible roles.
- Confidence values are included.
- Five screenshots, a contribution log, and a completed usage statement are present.

### Problems in the AI/orchestration section

1. **The 14-case harness does not assert the expected routing.** Cases 1–14 are printed only. A regression can change every mapping and still exit successfully.

2. **`console.assert` cannot fail CI.** Node logs failed assertions but exits with status 0, and the script prints `PASS` and `All checks complete` unconditionally. The unused `pass` and `warn` variables reinforce that this is a display harness, not a test suite.

3. **Confidence is not calibrated confidence.** It divides matched keywords by the total keyword list for that agent. A correct single-keyword routing typically scores around 0.07–0.20, while adding more synonyms to improve coverage automatically lowers scores.

4. **Substring matching can produce false positives.** Simple `includes()` matching has no token or phrase boundary handling.

5. **Personas are not instrumented for the live system.** They do not instruct agents to call `read_project_file`, `record_progress`, or `record_finding`, nor do they define the three backend severities (`breaks`, `warns`, `informational`). They instead use separate CRITICAL/HIGH/MEDIUM/LOW labels in markdown.

6. **Refactorer behavior is contradictory.** The persona says recommend changes, while `buildTaskDescription()` says to identify and apply them. This can cause an agent to mutate code during what should be a report-only audit.

### Current status

**Status: Good persona and routing prototype, insufficient automated verification and incomplete MCP integration.**

## 5. Mmpoiemang — Data / QA Engineer

### What is genuinely complete

- The demo fixture, input data, expected-output document, test file, demo script, screenshots, and contribution log exist.
- Four Python tests pass.
- Two real defect classes remain in the fixture: failed enrichment propagates `None`, and file handles are not closed.
- Four session screenshots are present.

### Problems in the QA/demo section

1. **The demo script is a guided checklist, not an end-to-end validator.** It verifies files and runs the broken Python pipeline, then prints a prompt for a human to paste into Bob. It does not launch Bob, capture a report, or compare actual findings with `expected_output.md` despite claiming to validate swarm output.

2. **The script is not portable to the current Windows environment.** It requires Bash, `python3`, and `/tmp`. On this machine `bash` invokes WSL, which has no installed distribution.

3. **The passing tests do not protect the planted demo defects.** They test functions that were already fixed. There are no tests asserting that the two intentional defects remain discoverable or that the pipeline fails in the expected way.

4. **Expected-output line references are stale.** The table points to old lines for `enrich_record` and the file handles.

5. **Bug counts and labels remain confusing.** The expected table lists two high-severity findings, while Bobalytics says three bugs. Source comments use old `BUG 1`, `BUG 3`, and `BUG 4` numbering after the decision to keep only two defect classes.

6. **Submission work remains.** Mmpoiemang's Bob usage statement is blank and the 60-second verbal demo walkthrough remains unchecked.

### Current status

**Status: Useful controlled fixture and evidence, but the demo is manual, platform-specific, and not self-validating.**

---

# Whole-Project Review

## Architecture verdict

The repository contains three real systems that work independently:

1. Bob's custom mode/skill/persona orchestration.
2. An MCP stdio server plus HTTP/WebSocket run store.
3. A React dashboard for creating and observing runs.

The missing component is a dispatcher connecting item 3 back to item 1. Today the lifecycle is:

`Frontend POST /runs → copy UUID → human opens Bob → Bob receives UUID → spawn_subagent → MCP findings/events → frontend`

The product language often implies:

`Frontend POST /runs → automatic Bob dispatch → events → report`

The first flow is demonstrated; the second does not exist. The report, README, demo narration, and submission should state the first flow accurately unless the bridge is actually implemented.

## Highest-priority technical risks

1. Manual frontend-to-Bob dispatch bridge.
2. Incorrect/non-idempotent run lifecycle and mutating report reads.
3. Lossy WebSocket events without replay or reconciliation.
4. Symlink/junction escape from the filesystem security boundary.
5. No repeatable backend or browser integration tests.
6. Node runtime/dependency requirements and missing MCP lockfile.
7. Significant documentation drift after the final frontend and demo commits.

## Submission readiness

The deadline recorded in the repository is **Sunday, 30 August 2026 at 16:00 SAST**, with an internal target of 12:00 SAST.

### Mandatory deliverables still marked incomplete

- Video of 90 seconds to 3 minutes with narrated, visible Bob usage.
- Problem/solution statement of at most 500 words.
- Final Bob usage statement.
- Public repository plus every member's screenshots and exported session report.

### Per-member evidence status

| Member | Screenshots | Usage paragraph | Immediate gap |
|---|---:|---|---|
| Sibusiso | 0 | Complete | Capture MCP/Bob orchestration screenshots |
| Lethabo | 2 | Missing | Add usage paragraph |
| Arisha | 0 | Missing | Add screenshots, contribution log, and usage paragraph |
| Farheen | 5 | Complete | No submission evidence gap identified |
| Mmpoiemang | 4 | Missing | Add usage paragraph and rehearse demo walkthrough |

## Documentation drift to fix

- Handover and launch guide still call the font and several frontend polish tasks unfinished.
- Launch guide still calls the reduced demo-bug decision unresolved, while `CRITICAL_DECISIONS.md` marks Option A resolved.
- Backend handover open items contradict later evidence that Git tools were live-tested.
- Architecture documentation lists the dashboard but does not make the manual run-ID bridge prominent enough.
- README quick start omits the complete backend/frontend/manual-run-ID procedure.

## Remote branch state

- `origin/BobSwarm_Subagents_test` and `origin/fix/pipeline-bugs` are ancestors of `main`.
- `origin/add-react-frontend` is not an ancestor of `main`, but its frontend was later imported under a different path and polished. Do not merge it directly into current `main`; compare it once for unique work, then archive/delete it after team confirmation.

---

# Recommended Starting Plan for Sibusiso

## Phase 1 — Stabilize the submission baseline first

1. Restart the stale Node backend so port 8787 serves the current code; verify `GET /runs` returns `[]` or a run list.
2. Perform one clean manual end-to-end run using the frontend-generated UUID and capture it on video.
3. Capture your missing screenshots and obtain Arisha's screenshots/contribution log.
4. Obtain Lethabo, Arisha, and Mmpoiemang's usage paragraphs.
5. Reconcile the stale handover, launch guide, polish guide, and demo counts.
6. Produce the problem/solution statement and final Bob usage statement.
7. Record the video before attempting risky architectural work.

## Phase 2 — Small, high-value code fixes

1. Make run state a strict state machine: `pending → running → complete|error`.
2. Make report reads non-mutating and finalization idempotent.
3. Reject progress/findings after completion.
4. Add event replay or snapshot reconciliation on WebSocket connection/reconnect.
5. Align `pending`/`queued` status contracts and improve frontend API errors.
6. Replace the decomposition display harness with real assertions and a failing test command.
7. Correct Node engine requirements and commit an MCP lockfile.

## Phase 3 — Complete the product after the submission is safe

1. Design the real frontend-to-Bob dispatch bridge.
2. Add integration tests for HTTP, WebSocket, store lifecycle, and MCP tools.
3. Enforce filesystem boundaries using resolved real paths and safe write-parent validation.
4. Make the demo runner cross-platform and machine-verifiable.
5. Add persistence or explicit cleanup for runs/subscribers if the project continues beyond the hackathon.

## Final decision

**Start from the synchronized `main` and preserve the demonstrated manual workflow for the submission.** Do not merge the old frontend branch wholesale. Do not spend the remaining submission window rebuilding the dispatcher unless the mandatory evidence and video are already complete. The strongest immediate outcome is an honest, polished demonstration of the real manual bridge, followed by targeted lifecycle and test fixes.

