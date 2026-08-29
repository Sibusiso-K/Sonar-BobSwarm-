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
  mmpoiemang/
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

- [ ] Add consumption-summary screenshots and matching exported task-history
  Markdown files under `bob_sessions/lethabo/`.
- [ ] Capture one clean MCP-panel screenshot with `bobswarm` connected. Avoid a
  frame containing failed commands, stale warnings, or unrelated dirty files.
- [ ] Immediately before the final recording, restart the current backend and
  verify `/health`, `/runs`, MCP tool visibility, and port 8787 ownership.

### P1 — final technical checks

- [ ] Support Sibusiso's final run and confirm the exact same dashboard UUID is
  used by every `record_progress`, `record_finding`, and `finalize_run` call.
- [ ] Confirm the recorded run follows the intended four-plus-one dependency
  model instead of dispatching Refactorer concurrently with Debugger.
- [ ] Confirm terminal WebSocket connections are cleaned up and no stale process
  serves an older build during the demo.

## Mmopiemang — QA, metrics, and data compliance

### P0 — required evidence

- [ ] Add consumption-summary screenshots and matching exported task-history
  Markdown files under `bob_sessions/mmpoiemang/`.
- [ ] Re-run the final fixture validation against the exact commit used in the
  video and record the command/result in the contribution log.
- [ ] Reconcile expected defect counts with the final fixture and recorded run.

### P1 — claims and measurement

- [ ] Remove the unsupported `2–4 hours` manual-investigation claim from
  `docs/bob-sessions/mmpoiemang/CONTRIBUTIONS.md` unless measured evidence exists.
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
