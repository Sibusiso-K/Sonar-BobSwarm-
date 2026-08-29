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
| **BobSwarm (real, recorded)** | **94 seconds** | Five parallel specialists, live Bob MCP session. First findings overlapping within a 15s window. Source: `docs/SUBMISSION_PACKAGE.md` D2. |
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

**Implausible results are defects until disproven, and a manual investigator
being faster than a 5-agent parallel swarm is implausible on its face** for
a genuine cold-start comparison. The honest conclusion is: **this specific
60.2-second number is not usable as evidence of anything except that I,
personally, remember this codebase well right now.** It should not appear
in D2, the video, or anywhere the "measurable impact" claim is made.

## What's actually needed before this rubric criterion can honestly claim 5/5

A **genuinely blind timed run** — someone who has not read `app.py`/
`utils.py` before, given the same golden prompt, timed the same way,
with no swarm access during their attempt.

**Checked concretely, not guessed:** `grep`'d every `docs/bob-sessions/*/
CONTRIBUTIONS.md` for references to the fixture files.
- **Farheen** — zero references. Her actual work (`decompose.js`, personas)
  never touched `app.py`/`utils.py` content.
- **Arisha** — no session log exists yet for her at all
  (`docs/bob-sessions/arisha/` is empty).

Either is a real candidate for the genuine blind run — Farheen is the safer
bet specifically, since her work never had reason to reference the bugs
even indirectly. If nobody on the team qualifies as genuinely unfamiliar by
the time this matters, the honest fallback is to say so explicitly in D2
rather than fabricate a blind condition that doesn't exist — a stated
limitation is compliant with the rules; an uncalibrated claim is not.

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
