# BobSwarm Competition Action Sheet — 2026-08-29

> **Owner:** Sibusiso (Lead / Orchestrator)
> **Audience:** Every team member
> **Current judge-readiness estimate:** 14.7/20; target after these gates: 18+/20.

This is the current source of truth for remaining competition work. Complete
the P0 evidence/compliance items before broad UI or architecture changes. When
you finish an item, add the commit hash and evidence path beside it, then tell
Sibusiso.

## Non-negotiable submission format

The IBM Bob guide requires a folder named `bob_sessions` in the final code
repository. For every relevant Bob task, each team member must add:

Official reference: [IBM Bob Hackathon Guide — exporting task session reports,
pages 18–19](https://watsonx-hackathons-2026.s3.us-cloud-object-storage.appdomain.cloud/Lablab-IBM-Bob-hackathon-guide-May-2026.pdf).

1. A screenshot of the Bob **task session consumption summary**.
2. The **Export task history** Markdown file downloaded from that same task.

Use this structure:

```text
bob_sessions/
  arisha/
  farheen/
  lethabo/
  mmopiemang/
  sibusiso/
```

The existing `docs/bob-sessions/` material remains useful supporting evidence,
but it does not replace the exact consumption-summary screenshots and exported
task histories above. Inspect every export for credentials, API keys, private
paths, client data, and personal information before committing it.

## Arisha — Frontend and judging visuals

### P0 — required evidence

- [x] Supporting Bob workflow screenshots landed in `docs/bob-sessions/arisha/`
  at commit `6061b66`. These help the story but are not the two official
  export artifacts below.
- [ ] Add `bob_sessions/arisha/<task>-consumption-summary.png`.
- [ ] Add the matching exported `bob_sessions/arisha/<task>-history.md`.
- [ ] Add a short `docs/bob-sessions/arisha/CONTRIBUTIONS.md` that points to
  the compliant exports and explains what Bob did during frontend work.
- [ ] Capture the real dashboard during an active Bob-driven run and after
  completion. Show agent statuses, timeline, severity, paths, symbols, and
  literal evidence. Do not use the conceptual mockup as proof of execution.

### P1 — focused product fixes

- [x] Persist the latest run pointer and rehydrate it from the backend snapshot
  after reload. Add an explicit reset/new-run path.
- [x] Make History rows reopen their run rather than acting as display-only rows.
- [x] Change the repository CTA to `View source`.
- [ ] Keep the current responsive behavior and verify the completed report at
  desktop and mobile widths.

### P2 — documentation visuals

- [x] Correct `agent-flow.svg`: include Onboarding; show four independent
  specialists in the first wave and Refactorer after Debugger; include the
  dashboard → operator handoff → Bob → MCP events → dashboard/report loop.
- [x] Label `landingpagemockupbobswarm.png` as a **conceptual design mockup**.
- [ ] Place a real completed-product screenshot beside or above the conceptual
  mockup before final submission.
- [ ] Treat the broad Figma/Claude/Lovable brief in `UI_UX_DEEP_CRITIQUE.md` as
  post-evidence exploration. Do not replace the real React application or risk
  the final capture for a large redesign.

## Farheen — Routing and persona consistency

### P0 — required evidence

- [ ] Add consumption-summary screenshots and matching exported task-history
  Markdown files under `bob_sessions/farheen/` for every relevant Bob task.

### P1 — correctness fixes

- [x] Make the selected dashboard `taskType` control decomposition. Required
  behavior: `full_audit` selects all five specialists; a specialist task type
  selects that specialist; keyword routing is used only when no explicit task
  type is supplied.
- [x] Add tests proving task-type and free-text combinations cannot dispatch the
  wrong set of agents.
- [x] Align persona severity with the MCP contract by using
  `breaks|warns|informational` in the active persona examples and system prompt.
- [x] Replace the newly added Debugger example about an empty-score
  `ZeroDivisionError`. The current fixture already guards empty values at
  `demo/sample-project/app.py:65`, so that example is no longer a real finding.
- [x] Re-check `lowConfidenceWarning`: fallback full-audit assignments now use a
  reachable `<= 0.5` threshold, covered by tests.

## Lethabo — Backend and live-run reliability

### P0 — required evidence

- [x] Add consumption-summary screenshots and matching exported task-history
  Markdown files under `bob_sessions/lethabo/`. Done at commit `dd8480e`:
  `bob_sessions/lethabo/01-task-consumption-summary.png` +
  `01-task-history.md`.
- [x] Capture one clean MCP-panel screenshot with `bobswarm` connected. Avoid a
  frame containing failed commands, stale warnings, or unrelated dirty files.
  The existing `docs/bob-sessions/lethabo/02-mcp-panel-connected-tasks-complete.png`
  didn't qualify (a failed `git pull --rebase` was visible in the same frame),
  but a clean one already existed in the 2026-08-30 golden-path recording
  (`bandicam 2026-08-30 01-41-50-977.mp4`, ~00:02) — extracted that frame
  directly rather than retaking live. Saved as
  `bob_sessions/lethabo/02-mcp-panel-connected.png`.
- [~] Immediately before the final recording, restart the current backend and
  verify `/health`, `/runs`, MCP tool visibility, and port 8787 ownership.
  Dry run completed 2026-08-30 ~04:30: fresh `npm start` instance verified
  `/health` (ok) and `/runs` (clean, empty), then killed to leave port 8787
  free for Bob's own spawned process to claim without contention — running
  a manual instance *and* Bob's own at the same time is the dual-store bug
  from earlier tonight. MCP tool visibility itself needs Bob open, which
  wasn't done this pass. **Still needs a final repeat immediately before
  the actual recording**, per the item's own wording — this proves the
  procedure works, it isn't a substitute for the final pass.

### P1 — final technical checks

- [ ] Support Sibusiso's final run and confirm the exact same dashboard UUID is
  used by every `record_progress`, `record_finding`, and `finalize_run` call.
  Genuinely blocked, not avoided — there's no run to check until he starts one.
- [x] Confirm the recorded run follows the intended four-plus-one dependency
  model instead of dispatching Refactorer concurrently with Debugger.
  Confirmed on a real end-to-end run (`2026-08-30`, screen-recorded):
  Debugger, Documenter, Onboarding, and Data lineage started together and
  ran in parallel; Refactorer stayed in "Waiting" until Debugger finished,
  then ran on its own. See `demo/TIMING_COMPARISON.md` for the full
  breakdown. Also surfaced two real bugs along the way, both fixed and
  pushed: the `BobSwarm Orchestrator` custom mode had never loaded in Bob
  (`id` vs. `slug` schema mismatch, commit `5d2efcc`), and running
  `npm start` in `mcp-server/` manually alongside Bob's own MCP connection
  creates two disconnected in-memory stores (`unknown_run_id` errors) —
  don't run it manually while Bob is connected, Bob's own spawned process
  already serves the dashboard bridge on 8787.
- [~] Confirm terminal WebSocket connections are cleaned up and no stale process
  serves an older build during the demo. Swept all node.exe processes
  2026-08-30 ~04:30: only the frontend Vite dev server was running (which
  hot-reloads on every change, so it's never a "stale build" concern by
  construction), zero stray backend instances. Holds only as long as
  nobody starts another manual `npm start` — worth a repeat sweep right
  before the actual recording, same as the item above.

## Mmopiemang — QA, metrics, and data compliance

### P0 — required evidence

- [ ] Add consumption-summary screenshots and matching exported task-history
  Markdown files under `bob_sessions/mmopiemang/`.
- [ ] Re-run the final fixture validation against the exact commit used in the
  video and record the command/result in the contribution log.
- [ ] Reconcile expected defect counts with the final fixture and recorded run.

### P1 — claims and measurement

- [ ] Remove the unsupported `2–4 hours` manual-investigation claim from
  `docs/bob-sessions/mmopiemang/CONTRIBUTIONS.md` unless measured evidence exists.
- [ ] Run a genuinely blind manual baseline using the same five-deliverable
  prompt, or explicitly state that no valid baseline was available. Do not use
  the existing 60.2-second recall run as speed evidence.
- [ ] Make the authoritative QA claim match the final recorded run. Do not mix
  historical `8 bugs`, `12 defects`, `42 findings`, and current `41 findings`
  without dates and clear labels.
- [x] Update `docs/DATA_SOURCES.md` to include `synthetic_input.json`, how it was
  generated, and the origin/licence of any submitted visual assets.

## Sibusiso — lead-only gates

These remain with Sibusiso; teammates should supply evidence, not silently edit
the final claims.

- [ ] Create/verify the root `bob_sessions/` structure and reject incomplete or
  unsafe exports before merging.
- [ ] Add Sibusiso's own consumption-summary screenshot and exported task history.
- [ ] Record one genuine 90–180 second golden-path video: dashboard run creation,
  UUID handoff, connected MCP, parallel first wave, dependent Refactorer, live
  dashboard events, and evidence-backed final report.
- [ ] Use `docs/SUBMISSION_PACKAGE.md` as the only final narrative. Reconcile or
  clearly mark historical documents so judges do not encounter contradictory
  metrics or architecture claims.
- [ ] Use only the recorded run's verified metrics. Until a valid blind baseline
  exists, claim parallel coverage, fewer handoffs, and evidence reliability —
  not proven time savings.
- [ ] Confirm eligibility, employer/affiliation disclosures, repository URL,
  video sharing permissions, and submission deadline for every member.
- [ ] Run `npm run verify`, scan for credentials, confirm a clean public remote,
  then freeze the submission.

## Definition of done

A team member is done only when their code/doc change, compliant Bob evidence,
verification result, and commit hash are all visible to Sibusiso. A mockup,
chat message, or uncommitted local screenshot is not completion evidence.
