# Timing Comparison — Manual Investigation vs. BobSwarm

> **Read the caveat before quoting any number from this doc in the pitch,
> the video, or D2/D3.** The first measurement here does not support a
> "swarm saves time" claim, and that's reported honestly rather than
> reframed — see below.

## What's being compared

The golden demo prompt (`docs/SUBMISSION_PACKAGE.md`): *"Audit
demo/sample-project end to end. Find defects, document the public API,
recommend safe refactoring, trace the data flow, and produce an onboarding
guide."*

| Run | Time | Method |
|---|---|---|
| **BobSwarm (real, recorded)** | **94 seconds** | Four independent first-wave specialists, followed by the dependent Refactorer, in a live Bob MCP session. First-wave findings overlapped within a 15s window. Source: `docs/SUBMISSION_PACKAGE.md` D2. |
| **Manual (this session, timed honestly)** | **60.2 seconds** | One investigator, `grep`/`Read` only, no swarm tooling. Timestamped start-to-finish, all 5 deliverables written. Evidence: `demo/manual-investigation-findings.md`, timestamps below. |

```
Start:  2026-08-29 14:31:39.883
End:    2026-08-29 14:32:40.034
Total:  60.151 seconds
```

## The caveat that matters more than the number

**The manual run was done by someone (me) who had already read `app.py` and
`utils.py` repeatedly over several hours of prior work on this exact repo
tonight.** That is not what "a developer investigating an unfamiliar
codebase" means. What got measured is closer to *recall-and-transcribe
speed* than *investigation speed* — I wasn't finding the bugs, I already
knew where they were.

**Implausible results are defects until disproven, and a warmed-up manual investigator
being faster than a dependency-aware swarm is not credible cold-start evidence** for
a genuine cold-start comparison. The honest conclusion is: **this specific
60.2-second number is not usable as evidence of anything except that I,
personally, remember this codebase well right now.** It should not appear
in D2, the video, or anywhere the "measurable impact" claim is made.

## Second recorded BobSwarm run — dependency-model verification (2026-08-30)

A separate, later end-to-end run, screen-recorded start to finish
(`bandicam 2026-08-30 01-41-50-977.mp4`). This is a **second BobSwarm-side
data point, not a manual/blind baseline** — it does not close the gap
below. Its purpose was verifying the four-plus-one dependency model
(Lethabo's P1 item in `docs/COMPETITION_ACTIONS_2026-08-29.md`), and it
incidentally re-confirms the swarm produces literal evidence-quoted
findings on a clean run.

**Read directly from the dashboard, not narrated:**
- Debugger, Documenter, Onboarding, and Data lineage went from "Waiting"
  to "Done" together — genuinely parallel.
- Refactorer stayed in "Waiting" for the entire first wave and only
  started once Debugger finished — the intended dependency, not a
  concurrent dispatch.
- Debugger card: 3 breaks, 3 warns, 1 informational (7 findings).
- Refactorer card: 1 breaks, 3 warns (4 findings).
- Bob's own "Run finished" message reported 24 findings across all five
  specialists — Documenter/Onboarding/Data lineage's individual
  breakdowns weren't separately confirmed against the dashboard cards, so
  treat the per-role split for those three as unverified until checked
  against the exported task history.
- Handoff was a single paste of the full multi-line prompt into Bob, no
  retry needed, prompt appeared intact on the first attempt.
- Cost: ~$0.11 / 42.7k tokens at roughly the run's midpoint (from Bob's
  own panel).

**Not yet confirmed, flagged rather than guessed:**
- The exact run ID: two independent reads of the recording (one manual,
  one via Gemini video analysis) disagreed on the UUID's remainder past
  the shared `2a4099cc` prefix. Rather than pick one, this should be
  pulled from Bob's own **exported task history** for that session
  (`Export task history`, same mechanism as the `bob_sessions/*/…-history.md`
  evidence files) — that log contains the literal `run_id` string Bob
  used in every tool call, which is authoritative where a screen
  recording isn't.
- Precise elapsed-time-per-specialist: approximate timestamps were read
  off the recording's on-screen clock, not off a machine-readable log.
  Good enough to confirm parallel-vs-sequential behavior; not precise
  enough to quote as a benchmark number.

## What's actually needed before this rubric criterion can honestly claim 5/5

A **genuinely blind timed run** — someone who has not read `app.py`/
`utils.py` before, given the same golden prompt, timed the same way,
with no swarm access during their attempt.

**Checked concretely, not guessed:** `grep`'d every `docs/bob-sessions/*/
CONTRIBUTIONS.md` for references to the fixture files.
- **Farheen** — zero references. Her actual work (`decompose.js`, personas)
  never touched `app.py`/`utils.py` content.
- **Arisha** — now has a session log, but she had already seen the fixture before
  her approximately eight-minute manual investigation, so her result is not blind.

### Arisha's Manual Investigation

Arisha completed the same five investigation tasks: bugs, API documentation, refactoring suggestions, data flow, and onboarding guide.

The completed manual findings are available in `demo/arisha-manual-investigation-findings.md`.

The investigation took about 8 minutes. However, the code had already been seen before the timed investigation, so this should not be treated as a blind or cold start measurement. It is included as a record of the investigation, not as evidence that manual investigation is faster than BobSwarm.

A valid manual timing comparison would require someone who has not seen the fixture before.


Farheen remains the only documented candidate for a genuine blind run, since
her routing and persona work did not require reading the fixture contents. Her
eligibility still needs direct confirmation before timing begins. If nobody on
the team qualifies as genuinely unfamiliar by
the time this matters, the honest fallback is to say so explicitly in D2
rather than fabricate a blind condition that doesn't exist — a stated
limitation is compliant with the rules; an uncalibrated claim is not.

### Farheen's submitted investigation — declaration pending

Farheen submitted a manual report with the same five requested deliverables:
`demo/farheen-manual-investigation-findings.md` (original supporting document:
`demo/farheen-manual-investigation-report.docx`). Her recorded interval is
**2026-08-30 02:55:00–04:40:09**, or **6,309 seconds (1:45:09)**.

Its defect analysis and screenshots are useful supporting material. It is not
yet a valid cold-start comparison because the report itself does not establish
that the participant was unfamiliar with the fixture, did not use AI/swarm
assistance, started timing before first inspection, and completed the exact
golden prompt under the stated rules. Obtain that written declaration before
adding it to the comparison table, D2, D3, pitch, or video.

## The harness, for whoever runs the real version

1. Start a timestamp the moment you open `app.py` for the first time (or as
   close to first-time as honestly available).
2. Work through the golden prompt's 5 requirements using only file reading —
   no swarm, no MCP tools, no asking anyone who already knows the answers.
3. Write up all 5 deliverables (bugs, API doc, refactor suggestions, data
   flow, onboarding guide) — same shape as `demo/manual-investigation-findings.md`.
4. Stop the timestamp the moment all 5 are written.
5. Record both timestamps and the elapsed time in this file, replacing the
   caveated measurement above — don't just add a second row, since the
   first one shouldn't be presented as a valid comparison at all once a
   real one exists.

## Do not do this instead

Do not time a second run by someone who has *also* already seen this
fixture, even briefly. Do not round or estimate a "typical developer" time
without an actual measurement — that's exactly the `sim_`-prefix-required
territory the project's own doctrine calls out. A missing number is a
stated limitation; a guessed number dressed as measured is a rules risk.
