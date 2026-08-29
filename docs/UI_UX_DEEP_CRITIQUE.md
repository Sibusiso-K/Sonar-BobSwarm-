# UI/UX Deep Critique + Path to 5/5 on Every Judging Criterion

> **For Sibusiso first** — read this, push back on anything you disagree with,
> amend it directly in this file, and we go back and forth here before it
> goes to the rest of the team. This isn't a finished directive, it's a
> starting position for a real discussion.
>
> Written by Lethabo (with Claude), 2026-08-29, ~14:14 SAST. Internal target
> deadline: Sun 30 Aug 12:00 SAST.
>
> **Update, same day ~14:40 SAST:** your `feat: harden BobSwarm for
> competition demo` (`9805f06`) landed while this was being written and
> genuinely resolves several items below — checked, not assumed: ran both
> new test suites myself (10/10 backend, 5/5 frontend, all pass), read
> `BobHandoff.tsx`/`handoff.ts`, and read the new `docs/SUBMISSION_PACKAGE.md`.
> Marked what's now done inline rather than rewriting the doc, so the
> back-and-forth trail stays visible. Genuinely strong work — the symlink
> guard, one-way lifecycle, WS snapshot/replay, and pinned `package-lock.json`
> all directly answer your own project review, and the Bob handoff panel is
> a better answer to Part 1's friction than what I'd proposed (see note
> there).

---

## Part 1 — the "swarm always resets" bug, diagnosed

> **Update:** `BobHandoff.tsx`/`handoff.ts` (in `9805f06`) already solves the
> *manual-copy-paste* half of this — a numbered step-2 panel generates the
> exact ready-to-paste Bob prompt with the full run ID embedded, one-click
> copy with error handling, no more digging through dev tools for a UUID.
> That's arguably a **better** fix than what I proposed below (Bob
> self-calling `POST /runs`) — it doesn't require touching the already-
> tested orchestration constitution, and `docs/SUBMISSION_PACKAGE.md`'s
> "Claims discipline" section deliberately calls this an **operator
> handoff**, not automated dispatch — which is the honest framing.
>
> **What's still genuinely open, checked directly** — `grep -r localStorage
> frontend/src/` returns nothing. The actual persistence gap below is
> unaddressed: a refresh, HMR reload, or navigation still loses all live
> state with no way to resume. The handoff panel makes *starting* a run
> painless; it doesn't make *reconnecting* to one survive a reload. Both
> matter, they're different problems.

This isn't randomness. Checked `frontend/src/hooks/useSwarmRun.ts` directly:
every piece of state (`run`, `roles`, `findings`, `timeline`, `report`,
`connState`) lives in plain React `useState`, with **zero persistence** —
no `localStorage`, no URL param, nothing. The backend keeps a run alive in
memory the entire time (confirmed — `mcp-server/store.js`'s run store
doesn't care whether anyone's watching), but the frontend has no mechanism
to *rediscover* an in-progress run after:

- a page refresh
- a Vite HMR full-reload (can happen from unrelated CSS/component edits
  during a live rehearsal — exactly when you'd least want it)
- navigating away and back

On every fresh mount, `run` starts as `null`. That's not a bug firing
randomly — it's the *complete absence* of a "resume" path, so anything that
remounts the page reads as "it reset."

**The fix, concretely:**
1. On `start()`, write `{ runId, taskDescription, taskType, repoRef }` to
   `localStorage`.
2. On mount, check `localStorage` for an active run ID. If present, call
   `GET /runs/:id/report` (already exists, already non-mutating as of
   today's fix) to get current state, then `subscribeToRun()` to resume
   live updates — same code path `start()` already uses, just triggered on
   mount instead of on submit.
3. Bonus, cheap once the above exists: the History panel already lists
   pending/running runs via `GET /runs` — clicking one of those rows could
   trigger the same resume logic, which also solves "someone else opens the
   page and wants to watch an already-running swarm" for free.

This is maybe 30-40 lines of code, all in `useSwarmRun.ts` plus a small
`onClick` in `RunHistory.tsx`. High leverage, not a big lift.

---

## Part 2 — the UI critique you actually asked for

Direct answer to "why does it feel basic": **the design tokens are good —
the palette, the typography choices, the grain texture are genuinely
considered. What's undermining it is layout monotony and container
uniformity, which are the two most common tells of AI-generated (Lovable /
v0 / Bolt-style) design, even in hand-written code.** Naming this plainly
because you asked for a full critique, not a gentle one.

### Tell #1 — every section is the same shape

Hero, Swarm stage, Report, History: all four are
`border-t border-line px-6 py-24`, all four open with the same
`font-mono text-xs uppercase tracking-[0.14em] text-stone` label followed by
a `font-display text-3xl/4xl` heading. Scroll the page and every section
announces itself identically. This is *exactly* what a template generator
produces — one section component, reused four times with different content.
A considered product breaks this rhythm on purpose: different section
heights, at least one asymmetric or bento-style composition, not four
uniform full-bleed blocks stacked top to bottom.

### Tell #2 — everything is the same container

`.glass` (translucent, blurred, rounded) is applied to role cards, history
rows, the timeline panel, and report cards — every single container in the
product uses one visual treatment. Real dev-tool design varies container
type by function: a raw list is not a card is not a bordered table is not a
full-bleed panel. Applying one "nice card style" everywhere is a strong
signal of a generated design system, not an art-directed one.

### Tell #3 — the actual data is under-designed relative to the product's value

This is the one that matters most. **The product's entire value proposition
is evidence-backed findings — literal quoted code, not paraphrase.** Right
now those findings render as prose in soft rounded boxes. Compare to what
dev tools with real design budgets do with equivalent data: Linear renders
data in dense, scannable rows with real typographic hierarchy; Warp and
Raycast use monospace and real tool output as the *hero visual itself*, not
decoration around it; GitHub's own newer UI uses syntax-aware code blocks
with inline diff markers, not paragraph text describing a diff. The evidence
field — literal source code — deserves a monospace block with a subtle
background at minimum (already flagged in `ARISHA_FRONTEND_POLISH.md` §4,
worth escalating from "nice to have" to "do this").

### Tell #4 — `LivingSwarmField` is technically the most impressive thing
built and it's being used as wallpaper

A reactive canvas particle system driven by real agent state is genuinely
good engineering — most teams won't have this. But right now it sits
*behind* content as ambient mood lighting. Ambient generative backgrounds
are themselves a common 2025-2026 AI-product marketing trope at this point —
using one doesn't read as distinctive anymore, it reads as "we know the
current AI-site aesthetic." To actually stand out, the field needs to be the
**protagonist** of an interaction, not the backdrop: e.g. a finding
literally travels as a particle from the discovering agent's card to the
report section when it lands, instead of dots drifting ambiently the whole
time. Same asset, used as the mechanism instead of the mood.

### Tell #5 — one typographic flourish, not a typographic system

The gold-italic Fraunces treatment on the hero's emphasis phrase is a nice
single moment, but it's used once and nowhere else with intent. A real
typographic system uses weight/size/color changes *functionally* — data vs.
narrative vs. meta-text look different everywhere, not just in the hero.

---

## What to actually go look at (concrete, not vague "get inspired")

- **Mobbin** — search "developer tools dark mode" and "AI agent dashboard."
  Specifically pull up **Linear**'s changelog/roadmap pages (asymmetric
  layout + functional typographic hierarchy, exactly what's missing here)
  and **Raycast**'s marketing site (real product screenshots and monospace
  output *as* the hero visual, not abstract shapes around it).
- **Warp** (warp.dev) — a terminal product whose entire marketing site is
  built around real terminal output as the hero. The closest real-world
  analog to "our hero visual should be real swarm output, not decoration."
- **Dribbble** — search "dev tool dashboard dark," "agent pipeline
  visualization." Filter hard for information-dense panels (Grafana-style
  done beautifully), not marketing-site heroes — this product needs a dense
  data view for the report, not another landing page.

**On tools:** if there's time for one real design session before more
component code gets written, mock the **Report view specifically** in
Figma first, with 2-3 of the above as an explicit moodboard pinned next to
it. That one screen is the actual product moment — worth 30 minutes of
deliberate design before more Tailwind classes get typed. If Figma time
isn't available, the prompt below is the fallback.

### Creative prompt to paste into Bob for the Report view specifically

```
Redesign ReportView.tsx to look like a real developer tool's data view, not
a marketing card layout. Reference: Linear's dense list rows, Warp's
terminal-output-as-hero-visual, GitHub's inline diff styling. Concretely:
- Each finding's `evidence` field renders as an actual code block
  (monospace, subtle background, not paragraph prose)
- Findings display as dense, scannable rows grouped by role — not
  individually padded glass cards
- Severity uses real visual weight (already have the left-accent-border
  pattern for "breaks" — extend that logic, don't just recolor a badge)
Do NOT reuse the .glass treatment for this section — this is data, not
marketing copy, and should look and feel different from the hero.
```

### Creative prompt for breaking section-layout monotony

```
Audit every top-level section in App.tsx (Hero, SwarmStage, ReportView,
RunHistory). Right now all four use the same border-t/px-6/py-24 wrapper
and the same label+heading pattern — pick ONE section (recommend
RunHistory, since it's the least visually distinct right now) and give it
a genuinely different composition: asymmetric or bento-grid layout, a
different section height, something that breaks the vertical-scroll
monotony rather than continuing it.
```

---

## Part 3 — "how is this different from others," stated plainly

This needs to be sayable in one breath, in the video, without hedging:

> Most AI code-review tools do a single linear pass and hand back a comment.
> BobSwarm decomposes a task into parallel specialist agents, dispatched
> through Bob's own Agent mode — not a wrapper — and every finding has to be
> a literal quoted line from the file, enforced in code, not just prompted.
> You can watch the swarm work and watch it catch its own mistakes, live.

Versus the two nearest comparisons:
- **GitHub Copilot code review / generic AI review bots**: single-pass,
  no visible process, no self-verification story, doesn't reach COBOL/RPG
  or anything outside CodeQL's supported languages.
- **Generic multi-agent demo repos** (AutoGen/CrewAI-style showcases):
  usually terminal/log output only, no real product surface. This has an
  actual UI a non-technical judge could watch and understand in 10 seconds.

---

## Part 4 — natural language / ease of use

Current task input is a free-text field plus 6 preset task-type buttons —
that part's genuinely fine, plain-language input is already the interface.
The friction isn't the input, it's everything *around* getting from "typed
a task" to "watching it happen" (the manual runId bridge, Part 1's reset
issue). Fix those two and "natural language, easy to use" becomes true
end to end, not just true at the input box.

---

## Part 5 — path to 5/5 on every judging criterion

*(Carried over from the earlier discussion, so it lives in one place with
everything else here.)*

**Completeness & feasibility (was ~4/5, likely higher now — re-score after
this lands):**
- ~~Automate the runId bridge~~ **Done, better than proposed** — `BobHandoff.tsx`,
  see Part 1's update above.
- ~~A real backend test suite~~ **Done** — `mcp-server/test/*.test.js`, 10/10
  pass, verified by actually running `npm test`, not trusting the file list.
  Covers exactly the review's gaps: symlink escape, non-mutating reads,
  one-way lifecycle, WS snapshot replay, pending-run timeout.
- ~~Frontend test coverage~~ **Done, wasn't even on this list** —
  `frontend/tests/*.test.ts`, 5/5 pass, using Node's native TS stripping
  (`--experimental-strip-types`) instead of adding a test framework dependency.
- ~~Commit `package-lock.json`~~ **Done** for `mcp-server`. Worth checking:
  does `frontend/package-lock.json` need the same treatment, or is there a
  reason it's still excluded?
- ~~One-command launch script~~ **Done** — `demo/run_demo.ps1` (Windows) runs
  a 6-test preflight (`validate_demo.py`) then prints the exact handoff
  steps. Tested it directly, works cleanly.
- **Still open:** the localStorage/reset gap (Part 1). Nothing else on this
  list is outstanding as far as I can tell — genuinely good progress.

**Creativity & innovation (currently ~3.5/5):**
- Real GitHub PR integration — a subagent reads an actual PR diff via the
  GitHub API and posts findings back as a real PR comment. Biggest single
  swing available, scoped already in `BACKEND_CONCEPTS_AND_VALUE_PROP.md`,
  never built.
- Stage the Reviewer persona catching a fabricated finding, live, on camera
  — zero new code, pure demo staging, most memorable moment available.
- A second language in the same run (one small JS/Go fixture) — rebuts
  "is this actually general or hardcoded to one demo."

**Design & usability (currently ~3/5):**
- Everything in Part 1 and Part 2 above.
- Click-to-watch from History (small addition once Part 1's fix lands).
- A one-click "try it" button pre-filling the known-good demo scenario.

**Effectiveness & efficiency (was ~3/5):**
- **Partial progress, worth noting precisely:** `docs/SUBMISSION_PACKAGE.md`
  now states a real recorded measurement — "41 evidence-backed findings
  across five disciplines in approximately 94 seconds, with their first
  findings overlapping within a 15-second window." That's genuine swarm-
  speed evidence, and it's framed correctly (a recorded result, not an
  estimate — matches the doc's own "claims discipline" section).
- **Still the one gap that matters most here:** that's swarm speed alone,
  not a comparison. The rubric's literal word is "measurable impact" — what's
  still missing is *a human doing the same investigation by hand, timed
  honestly, next to that 94 seconds*. Without the "vs. what" half, it's a
  fast demo, not yet a demonstrated time-saving. This is the one item from
  the original list still fully open, and probably the single highest-
  leverage thing left across the whole rubric.
- Show it scaling: run against a second, larger fixture, report comparable
  time.

---

## Part 5b — the D3 fragmentation from earlier is also resolved

Separate from this doc's original scope, worth recording here since it was
a real, flagged risk: Mmopiemang's standalone `docs/SUBMISSION.md` and the
five separate first-person paragraphs collected in `HANDOVER.md` were two
different, inconsistent accounts of the team's Bob usage. `docs/
SUBMISSION_PACKAGE.md` supersedes both with a single coherent D2/D3
narrative, a video storyboard, a golden demo prompt, and explicit
submission-day gates. One thing worth the team confirming out loud: this is
a rewrite, not a literal assembly of the five paragraphs — make sure
everyone's comfortable that their individual contribution reads clearly
enough in the combined version, since the original plan was "each person's
paragraph gets stitched in," and this took a different, arguably stronger,
approach instead.

## Part 6 — other things worth doing before this goes wider

- **Arisha should watch a real live run before doing more UI work.** Per
  the review and this session's history, most of her build/testing has
  been against mocked or self-driven data, not a genuine Bob-driven swarm.
  Seeing real findings land live would sharpen exactly the kind of design
  decisions this doc is asking for — designing against real data beats
  designing against assumptions about what the data looks like.
- Once you've amended this (Sibusiso), it goes to the whole team — Arisha
  and Farheen specifically should weigh in on Part 2/3 before anyone starts
  building against it, since it touches both their areas.

---

## Sibusiso — your turn

Push back, cut what you disagree with, add what's missing. This is a
starting position, not a directive.
