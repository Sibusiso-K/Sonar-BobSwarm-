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

> **Lead review update — 2026-08-29:** I agree with the root cause and the
> need for a reload-safe resume path. I am narrowing two claims below against
> the current tree: a timing-comparison harness now exists, although its first
> manual baseline is explicitly invalid as performance evidence, and
> `ReportView` already renders literal evidence in monospace code blocks with
> severity-specific visual weight. The remaining design issue is density,
> navigation, and information hierarchy—not absence of code rendering.

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
1. On `start()`, persist only `{ runId, taskDescription, taskType, repoRef }`
   as an active-run pointer. Do not persist mutable findings or timeline data
   as a second source of truth.
2. On mount, prefer an explicit `?run=<id>` URL parameter, then fall back to
   the active-run pointer. Call `GET /runs/:id/snapshot` to hydrate the full
   authoritative state, then use `subscribeToRun()` with the last sequence to
   resume live updates. The snapshot endpoint is the right source because
   `/report` does not contain role progress or the event timeline.
3. Clear the active pointer only when the user explicitly resets or when a
   terminal `complete`/`error` state has been successfully hydrated. Keep the
   completed run in History.
4. Add a real History selection action for pending/running rows once the hook
   accepts a requested run ID. This is useful, but it is a follow-up to the
   reload-safe resume path rather than a reason to expand the run protocol now.

This is browser-session resilience, not durable persistence: because the
current backend store is intentionally in-memory, a server restart still ends
the run. The UI and submission copy should say "resume after refresh while the
bridge is alive," not imply production-grade durability.

This is a small, scoped change across `useSwarmRun.ts`, the API helper, and a
History selection action. It is high leverage, but should still be tested as a
real lifecycle feature rather than treated as a cosmetic localStorage tweak.

---

## Part 2 — the UI critique you actually asked for

Direct answer to "why does it feel basic": **the design tokens are good —
the palette, the typography choices, the grain texture are genuinely
considered. What's undermining it is layout monotony and container
uniformity, which are the two most common tells of AI-generated (Lovable /
v0 / Bolt-style) design, even in hand-written code.** Naming this plainly
because you asked for a full critique, not a gentle one.

### Tell #1 — the lower sections repeat the same shape

The three lower sections—Swarm stage, Report, and History—are all
`border-t border-line px-6 py-24`, and all three open with the same
`font-mono text-xs uppercase tracking-[0.14em] text-stone` label followed by
a `font-display text-3xl/4xl` heading. The Hero already has an asymmetric
two-column composition, so the issue is specifically the repeated lower data
sections. A considered product breaks this rhythm on purpose: different
section heights or a bento-style data view instead of three uniform full-bleed
blocks stacked top to bottom.

### Tell #2 — everything is the same container

`.glass` (translucent, blurred, rounded) is applied to role cards, history
rows, the timeline panel, and report cards — every single container in the
product uses one visual treatment. Real dev-tool design varies container
type by function: a raw list is not a card is not a bordered table is not a
full-bleed panel. Applying one "nice card style" everywhere is a strong
signal of a generated design system, not an art-directed one.

### Tell #3 — the actual data still needs a denser developer-tool hierarchy

This is the one that matters most. **The product's entire value proposition
is evidence-backed findings — literal quoted code, not paraphrase.** The
current tree has already corrected the most serious version of this: findings
render as literal monospace code blocks, and `breaks` findings get a left
accent border. The remaining issue is that the evidence is still nested
inside roomy, repeated glass cards rather than presented as dense, scannable
developer-tool rows with stronger path/line/severity navigation. Compare to what
dev tools with real design budgets do with equivalent data: Linear renders
data in dense, scannable rows with real typographic hierarchy; Warp and
Raycast use monospace and real tool output as the *hero visual itself*, not
decoration around it; GitHub's own newer UI uses syntax-aware code blocks
with inline diff markers, not paragraph text describing a diff. The evidence
field now meets the basic monospace-block requirement; syntax-aware line
markers, tighter rows, and faster scanning are the remaining opportunities.

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
- **GitHub Copilot code review / generic AI review bots**: generally present a
  single-pass review with less visible specialist process and no equivalent
  evidence-gated swarm dashboard in this product comparison.
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
- **Reproducible installs:** `mcp-server/package-lock.json` is committed, but
  `frontend/package-lock.json` is still absent. That is a real clean-checkout
  follow-up: either commit the frontend lockfile or document why the frontend
  intentionally relies on an external lock/install process.
- ~~One-command launch script~~ **Done** — `demo/run_demo.ps1` (Windows) runs
  a 6-test preflight (`validate_demo.py`) then prints the exact handoff
  steps. Tested it directly, works cleanly.
- **Still open:** the localStorage/reset gap (Part 1), the frontend lockfile
  decision, and the remaining evidence/presentation gates. The core backend
  hardening and manual Bob handoff work are genuinely complete.

**Creativity & innovation (currently ~3.5/5):**
- Real GitHub PR integration is a plausible post-contest extension, but it is
  not the best pre-submission move: it adds credentials, network dependency,
  and a second product story while the existing local-repository workflow is
  already demonstrable.
- Do not stage a fabricated finding as if it were spontaneous. If the team
  wants a memorable trust moment, demonstrate the existing evidence contract
  rejecting an empty or unsupported finding, and label it explicitly as a
  validation step.
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
- **The comparison now exists as a harness, but not yet as valid speed evidence.**
  `demo/TIMING_COMPARISON.md` records a 60.2-second manual attempt next to the
  94-second BobSwarm run, then correctly disqualifies that manual number
  because the investigator already knew this fixture. The highest-leverage
  remaining action is therefore a genuinely blind manual run by a teammate
  who has not studied `app.py`/`utils.py`, using the same five deliverables and
  timing rule. Until that exists, do not claim that BobSwarm is faster; claim
  parallel coverage, first-finding overlap, and evidence-backed breadth.
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

- **Arisha should validate the final visual hierarchy against a real live run**
  before the recording. This is now a submission-evidence and polish action,
  not a claim that the current frontend is still mocked; the integration
  baseline and handover record genuine Bob-linked live rendering.
- Once you've amended this (Sibusiso), it goes to the whole team — Arisha
  and Farheen specifically should weigh in on Part 2/3 before anyone starts
  building against it, since it touches both their areas.

---

## Sibusiso — your turn

Push back, cut what you disagree with, add what's missing. This is a
starting position, not a directive.

## Sibusiso — lead response

### Agreed and adopted

- The reset report is a real reload-resume gap. The backend can retain a run
  while the dashboard loses its React state, so the fix should persist a small
  active-run pointer and rehydrate from the authoritative snapshot.
- The lower-page composition is too repetitive for a product whose strongest
  value is information density. The next visual improvement should target the
  Report view, not add more decorative background effects.
- The 94-second BobSwarm result needs a valid blind manual baseline before the
  team makes a time-saving claim.

### Pushed back / cut

- The critique no longer says that no timing comparison exists; the harness is
  present, but its first baseline is not valid evidence.
- The critique no longer says evidence is rendered as prose. Code blocks and
  severity weighting are already shipped; the open issue is density and
  scanning.
- GitHub PR integration and a staged fabricated finding are cut from the
  pre-submission plan. They create risk and distract from the Bob-native,
  evidence-gated local-repository story.

### Proposed order of work

1. Implement reload-safe snapshot resume, with URL override and an explicit
   reset path.
2. Run one blind manual timing baseline and update `demo/TIMING_COMPARISON.md`
   without carrying forward the caveated number.
3. Make one deliberate Report-view density pass, then freeze the product for
   the genuine Bob video and evidence capture.

---

## Part 7 — Arisha's design production brief

> **For Arisha.** Written assuming you have working access to Figma, Claude
> (chat + Claude Design's canvas/artifact tooling), and Lovable, with no
> practical credit ceiling on any of them for this task — so this is written
> at the ambition level that assumption justifies, not the "cheapest thing
> that works" level the rest of this doc had to operate at. Follow it in
> order; each stage's output feeds the next. Lethabo will separately hand
> you the literal prompt and pointer to this section — this is the detail
> behind that pointer.

### 7.1 — the system, formalized (extend what exists, don't replace it)

The existing tokens in `frontend/src/index.css` are the right foundation —
keep every hex value below unless you have a specific reason to change one.
What's missing is *system*, not *palette*.

**Color — current tokens, plus the roles they should play:**

| Token | Hex | Current use | Extend to |
|---|---|---|---|
| `--color-void` | `#0b0a08` | page background | Also: the base for all data-table row backgrounds — don't introduce a second "off-black" |
| `--color-void-soft` | `#131110` | — | Card/panel background *specifically for data views* (Report, History) — currently unused, this is your differentiator from `.glass` |
| `--color-paper` | `#f3ede1` | primary text | — |
| `--color-paper-dim` | `#b9b0a0` | secondary text | — |
| `--color-stone` / `--color-stone-dim` | `#8a8175` / `#5c564c` | labels, meta | — |
| `--color-gold` / `--color-gold-soft` / `--color-gold-dim` | `#d9a441` / `#e7c37a` / rgba | CTA, emphasis, `done` state | Reserve gold *only* for "success/complete" and the one hero emphasis phrase — right now it's doing CTA + emphasis + status, which dilutes what "gold" means when a user sees it |
| `--color-violet` / `--color-violet-soft` | `#8b7bd8` / `#b4a9e8` | `active`/`investigating` state | Keep scoped to "in progress" — don't let it leak into decoration |
| `--color-breaks` / `--color-warns` / `--color-info` | `#e0654f` / `#d9a441` / `#5fa8d9` | severity | — |

**Note the collision:** `--color-warns` and `--color-gold` are the *same
hex* (`#d9a441`). That's not a bug, but it means a "warns" severity badge
and a "done/success" indicator currently read identically at a glance —
worth a deliberate decision (either keep the deliberate overlap and explain
why, or split them) rather than an accident nobody chose.

**Add, don't replace:**
- A **data-grid line color** — something between `--color-line` (0.08 opacity)
  and `--color-line-strong` (0.16) specifically for table/row dividers in a
  denser Report view. Try `rgba(243, 237, 225, 0.11)`.
- A **second texture**, alongside `grain`: a very subtle 1px dot-grid or
  line-grid background (opacity ~0.03-0.04) specifically for data-dense
  panels, so they read as "instrument panel" rather than "card on a page."

**Typography — turn the one flourish into a system:**

| Role | Font | Weight/style | Where |
|---|---|---|---|
| Hero display | Fraunces | 450-560, italic for emphasis only | Already correct, keep |
| Section headings | Fraunces | 450, roman (not italic) | Already correct |
| Data (findings, paths, symbols, timestamps) | IBM Plex Mono | 400 | This should be the *dominant* voice of the Report and History views — currently under-used relative to how much data the product actually shows |
| Narrative/UI copy | Inter | 400-500 | Body text, buttons, nav |
| Meta/labels | IBM Plex Mono | 500, uppercase, tracked | Already correct pattern (`text-xs uppercase tracking-[0.14em]`), extend it everywhere a label appears, including inside data rows |

The rule to apply everywhere: **if it's a fact about the code (a path, a
symbol, a severity, a timestamp, a run ID), it's mono. If it's prose written
for a human, it's Inter. If it's a moment of emphasis, it's Fraunces
italic — and only one thing per screen gets that treatment, not
one-per-section.**

### 7.2 — concrete references, with what to steal from each

Don't open these for "vibes" — pull one specific pattern from each:

- **Linear** (`linear.app/changelog`, `linear.app/method`) — steal the
  **dense list row pattern**: icon, primary text, secondary meta, right-
  aligned status, all on one line, minimal padding, hairline dividers not
  cards. This is the direct fix for Report/History.
- **Raycast** (`raycast.com`) — steal the **product-screenshot-as-hero**
  pattern: real UI, not abstract shapes, given the compositional weight a
  marketing illustration would normally get.
- **Warp** (`warp.dev`) — steal **real terminal output treated as the star
  of the page**, including how it uses monospace at a *larger* size than
  you'd expect for genuine data, not shrunk-down-because-it's-secondary.
- **Vercel dashboard** (`vercel.com/dashboard` if you have access, or
  Mobbin) — steal the **deployment-log live-tail pattern**: exactly the
  shape of "watch parallel work happen in real time," which is what
  `SwarmStage` is trying to be.
- **GitHub's PR diff view** — steal **inline evidence styling**: a code
  line with a colored left gutter marker, not a code block floating in a
  card.
- **Mobbin search terms** (use these exact phrases): `"developer tool dark
  mode dashboard"`, `"AI agent live status"`, `"log viewer dark"`.
- **Dribbble search terms**: `"dev tool dashboard dark"`, `"data table dark
  ui"`, `"agent pipeline visualization"` — filter hard for information-
  dense results, discard anything that's a marketing hero with no real data
  in it.

### 7.3 — workflow: Figma → Claude Design → Lovable → back into the real codebase

**Stage 1 — Figma (wireframe, structure only, no color yet).**
Build the Report view and History view as gray-box wireframes first —
literal boxes and text placement, zero color/type decisions. Pin 3-4
screenshots from 7.2 as a moodboard frame right next to your wireframe.
Goal: prove the *density and hierarchy* works before any visual polish gets
attached to it. This stage should take under an hour — if it's taking
longer, you're polishing too early.

**Stage 2 — Claude Design (high-fidelity mockup from the wireframe).**
Use the prompt in 7.4 below, feeding it a screenshot/export of your Stage 1
wireframe plus the token table from 7.1. Iterate here, not in code — this
is the cheap-to-change stage.

**Stage 3 — Lovable (interactive prototype, exploration only).**
Use Lovable to build a *throwaway* interactive prototype of the one highest-
risk interaction: `LivingSwarmField` as protagonist (a finding traveling
from an agent card to the report on discovery — see Tell #4 in Part 2).
This is genuinely hard to judge from a static mockup; Lovable's speed is
well-suited to trying 2-3 versions of *motion* fast. **Do not plan to ship
Lovable's generated code directly** — the real codebase is hand-built
React/Tailwind/Framer Motion with real WebSocket data flowing through it;
porting a Lovable app wholesale would be a bigger risk than it's worth this
close to the deadline. Use it to find the *right motion curve and timing*,
then hand-implement that specific interaction in `LivingSwarmField.tsx`.

**Stage 4 — back into the real codebase.**
Once Stage 2/3 converge on a direction, implement directly in
`ReportView.tsx`/`RunHistory.tsx`/`LivingSwarmField.tsx` against real data
(the fixture repo's actual findings), not mockup placeholder text — the
critique in Part 2 exists specifically because "looks good with placeholder
content" and "looks good with real evidence text of varying length" are
different problems.

### 7.4 — ready-to-paste prompts

**Claude Design — Report view high-fidelity mockup:**
```
Design a high-fidelity dark-mode dashboard screen for a developer tool
called BobSwarm. This is the "Report" view — it shows findings from an
AI code-audit swarm, grouped by specialist role (Debugger, Documenter,
Refactorer, Onboarding, Data Lineage).

Design system tokens (use exactly):
- Background: #0b0a08 (void), secondary panel bg: #131110 (void-soft)
- Text: #f3ede1 (paper) primary, #b9b0a0 (paper-dim) secondary, #8a8175 (stone) meta
- Accent: #d9a441 (gold) for success/complete states only
- Severity: #e0654f (breaks), #d9a441 (warns), #5fa8d9 (informational)
- Display font: Fraunces (serif, editorial, used sparingly)
- Data/mono font: IBM Plex Mono (this should dominate the data view)
- UI font: Inter

Reference patterns to follow: Linear's dense list rows (icon + primary text
+ meta + right-aligned status, hairline dividers, minimal padding — NOT
individually padded cards), GitHub's inline diff styling for code evidence
(colored left gutter, not a floating code block in a card).

Layout: a dense, scannable table/list of findings. Each row: severity
indicator (left edge color bar, not just a badge), file path + line number
in mono, target symbol name, one line of literal evidence in a monospace
block with subtle background, grouped under role headers. This is a data
instrument panel, not a marketing card layout — err toward density over
whitespace.

Do not use glassmorphism/blur effects for this screen — reserve that
treatment for the marketing hero only.
```

**Claude Design — reactive LivingSwarmField concept (feeds Lovable stage):**
```
Concept sketch (not final code) for a reactive particle-field visualization
in a dark-mode dev tool dashboard. Five clusters of particles represent
five AI agents working in parallel, each cluster near its own status card.
When an agent "finds" something, one particle should visibly detach from
its cluster and travel toward a "report" area, arriving with a small burst/
glow, then the finding appears in the report list. Color per agent role:
violet while investigating, gold when done. Style: warm dark background
(#0b0a08), soft glow (not neon/cyberpunk), restrained motion — this should
read as "instrument," not "screensaver."
```

**Lovable — interactive motion prototype:**
```
Build a small interactive React prototype: a dark page (#0b0a08 background)
with 5 labeled circular clusters of small glowing dots (particles), each
cluster representing an agent (Debugger, Documenter, Refactorer, Onboarding,
Data Lineage). Add a button "Simulate finding" that, when clicked, picks a
random cluster, animates one particle traveling in a smooth arc from that
cluster to a "Report" box on the right side of the screen, with a brief
glow/pulse on arrival, then adds a line of placeholder text to a list
inside the Report box. Use framer-motion for the animation. Keep it dark,
warm-toned (gold #d9a441 and violet #8b7bd8 as the only accent colors),
minimal — the goal is testing the motion timing and easing, not visual
polish. Make the arc duration and easing easy to tweak via a few exposed
constants at the top of the file.
```

### 7.5 — what "done" looks like for this pass

Not "the whole app redesigned." Specifically:
1. Report view reads as a dense data instrument, not a stack of prose cards
   (Tell #3).
2. `LivingSwarmField` does one real thing tied to real events, not just
   ambient drift (Tell #4).
3. At least one section (recommend History, per Part 2) has a genuinely
   different composition from the other three (Tell #1).
4. The mockup in `README.md` and the actual live app no longer visibly
   diverge — this is the real finish line, not the mockup itself.
