# BobSwarm Judge Demo Runbook

> Owner: Sibusiso, Lead / Orchestrator
>
> Goal: record one honest, readable, sub-three-minute demonstration that proves
> IBM Bob is the execution engine, shows at least 90 seconds of the working
> product, and closes on measurable evidence rather than promises.

## Current judging position

| Criterion | Current score | What judges can verify | Remaining gate |
|---|---:|---|---|
| Completeness and feasibility | 4.4 / 5 | Bob mode and skill, five personas, MCP server, React dashboard, recovery, tests, launch guide | Final uninterrupted capture and complete team evidence |
| Creativity and innovation | 4.6 / 5 | Observable four-plus-one specialist swarm and literal-evidence contract | Explain differentiation in one sentence, without generic "multi-agent" claims |
| Design and usability | 4.3 / 5 | Polished staged UI, sample-audit loader, handoff, live roles, timeline, report, history | Operator still switches to Bob and pastes the handoff |
| Effectiveness and efficiency | 3.8 / 5 | Recorded 94-second run, 41 evidence-backed findings, overlapping specialists | Blind manual baseline declaration and accuracy/coverage comparison are not yet valid |
| **Total** | **17.1 / 20** | Strong prize-level proof of concept | Evidence and final video determine whether the score holds |

Potential after the remaining evidence and video gates: **18.3-18.8 / 20**.

## The winning story

**Problem:** one repository audit crosses debugging, documentation, refactoring,
onboarding, and data-lineage work. A developer normally performs these passes
sequentially and then reconciles the results manually.

**Solution:** BobSwarm turns one request into four independent IBM Bob
specialists plus a dependent Refactorer. Their progress is observable, and a
finding cannot enter the unified report without a literal source quote.

**Differentiator:** "Other coding assistants return an answer. BobSwarm shows
which specialist found each issue, when it ran, and the exact source evidence
that supports it."

**Measured proof:** use only the committed result: five roles, 59 live events,
41 evidence-backed findings, approximately 94 seconds, and overlapping
first-wave work. Do not claim a speedup until Farheen's blind-run conditions are
confirmed and the outputs are shown to be comparable.

## Before opening the recorder

1. Close notifications, email, chat, password managers, and unrelated tabs.
2. Use one 16:9 display. Set browser and Bob text large enough to read at normal
   playback speed; 110-125% browser zoom is a good starting point.
3. Reopen the repository in Bob. Confirm the **BobSwarm Orchestrator** mode and
   the `bobswarm` MCP connection.
4. Start one frontend only. Bob's MCP process should own port 8787; do not start
   a second backend if Bob already owns it.
5. Run `npm run verify`, then `npm run demo:preflight`.
6. If preflight reports failed or unfinished history, reconnect/restart the MCP
   server before recording. Re-run preflight until the runtime checks pass.
7. Open `http://127.0.0.1:5173`, click **Load sample audit**, and rehearse the
   exact window switches without dispatching a run.
8. Keep the final problem statement, Bob usage statement, repository URL, and
   team names in a separate checklist. Do not show private notes in the video.

## Three-minute recording script

| Time | Screen action | Sibusiso's narration |
|---|---|---|
| 0:00-0:12 | BobSwarm hero | "A full repository audit is not one task. It is five specialist jobs that developers usually run and reconcile sequentially." |
| 0:12-0:25 | Bob mode and connected MCP panel | "BobSwarm is built natively on IBM Bob Agent mode, subagents, parallel tasks, skills, and MCP tools. Bob is the execution engine." |
| 0:25-0:40 | Dashboard; click **Load sample audit**, then dispatch | "One request creates a tracked run against our controlled sample repository." |
| 0:40-0:52 | Copy-ready handoff, then paste into Bob | "The dashboard hands the exact run ID to Bob. This explicit operator handoff keeps Bob in control and prevents invented run IDs." |
| 0:52-1:12 | Bob dispatching subagents | "Debugger, Documenter, Onboarding, and Data Lineage start together. Refactorer waits for Debugger evidence before it begins." |
| 1:12-2:26 | Dashboard role cards and interleaved timeline | "The workflow is observable in real time. Every finding carries role, severity, file, symbol, and a literal quote from source." Keep narration light and let the changing UI prove the point. |
| 2:26-2:50 | Unified report | "This real run produced five-role coverage and one deterministic report. Our committed benchmark recorded 41 evidence-backed findings and 59 events in about 94 seconds." |
| 2:50-3:00 | Summary/hero | "Today this audits unfamiliar repositories. The same orchestration pattern extends to code review, release readiness, security, and onboarding." |

Do not speed up the live product segment, label replay as live, or use synthetic
events in the submission video. If the run is slower than rehearsal, shorten
the closing sentence rather than cutting away from the proof.

## Arcade workflow

Arcade is useful, but the final entry must still look like a real product run.
Use the **Arcade desktop app in Video mode**, not the Chrome extension's
interactive mode: the demo switches between the browser, IBM Bob, and possibly
a terminal, which requires desktop/multi-window capture.

1. In Arcade, create a new video capture and select the single display or a
   fixed 16:9 area containing Bob and the browser.
2. Record the real golden run in one take. Do not enter credentials or expose
   private team messages, API keys, consumption balances, or personal paths.
3. Trim only dead air at the start/end. Keep chronological order so the run is
   demonstrably genuine.
4. Add chapter/callout text sparingly: **Problem**, **IBM Bob orchestration**,
   **Parallel first wave**, **Literal evidence**, **Unified report**.
5. Add your own narration or a concise voiceover. Captions should be reviewed
   manually, especially `BobSwarm`, `MCP`, and specialist names.
6. Use a dark or no-wrapper theme so Arcade does not compete with the product's
   visual design. Avoid decorative music under technical narration.
7. If your Arcade plan supports MP4 export, use the Presentation preset and
   match capture/export dimensions. Verify the result remains under 3:00.
8. Arcade's video export is plan-dependent and may not embed closed captions.
   Upload the final MP4 to YouTube, Vimeo, or Google Drive and verify captions,
   readability, duration, and anonymous sharing in a private browser.
9. If MP4 export is unavailable or the text is not crisp, use a local 1080p
   recorder for D1 and keep the interactive Arcade as supplementary material.

## Evidence gaps that still cost points

| Member | Current root `bob_sessions/` status | Required action |
|---|---|---|
| Sibusiso | Missing consumption summary and exported task history | Export the final relevant Bob task and capture its consumption summary |
| Lethabo | Consumption summary and task history present | Confirm the committed files match the sessions named in D3 |
| Arisha | Missing consumption summary and exported task history | Export the frontend Bob task and capture its consumption summary |
| Mmopiemang | Consumption summary and task history present | Confirm the committed report is the same run shown in screenshots |
| Farheen | Missing consumption summary and exported task history | Export the persona/decomposition Bob task and capture its consumption summary |

The manual investigation DOCX is timing evidence only; it does not replace
Farheen's Bob consumption summary or exported Bob task history.

## Final judge-facing checklist

- Video is narrated, 90 seconds to 3 minutes, with at least 90 seconds of real
  on-screen product demonstration.
- Bob mode, MCP connection, exact handoff, parallel subagents, dependent
  Refactorer, live dashboard, and literal evidence are all readable.
- Repository is public, clean, pushed, and contains no credentials or personal
  information.
- All five members have root `bob_sessions/<name>/` consumption screenshots and
  matching exported histories.
- D2 is at most 500 words; D3 names only IBM Bob tools actually shown or backed
  by committed evidence.
- The video link is tested while signed out, and the entry is submitted before
  the internal deadline with no post-deadline changes.
