# Frontend Polish — Fonts, Flow, Wording

> **For Arisha.** The backend/integration work is done — `frontend/` is
> already wired to the real WebSocket, verified live (see
> `docs/LAUNCH_GUIDE.md` if you're seeing a connection error — it's almost
> certainly the backend not running locally, not a wiring problem).
> This doc is pure design/UX, no integration work needed.
>
> Your existing design system (warm void/paper palette, gold accent, grain
> texture, the hand-rolled `SwarmField` dot-and-thread SVG) is genuinely
> good — not generic. Everything below builds on it, none of it replaces it.

---

## 1. The font bug — fix this first, biggest visual impact for the least effort

`src/index.css` declares:
```css
--font-display: "Fraunces", "Georgia", serif;
--font-mono: "IBM Plex Mono", ui-monospace, monospace;
--font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
```
But none of these fonts are actually loaded anywhere — no `<link>` in
`index.html`, no `@font-face`, no package. Every browser has been silently
falling back to `Georgia`/`system-ui`/`ui-monospace` this whole time. The
entire typographic identity you designed has never rendered as intended.

**Fix — add to `index.html`'s `<head>`:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```
This one change will visibly alter the whole site more than any layout
change below.

## 2. Hero heading — positioning, wording, emphasis

**Positioning:** `Hero.tsx` is fully centered (`items-center text-center`)
over a full-bleed ambient background. That's the most common hero layout
pattern — reads as templated regardless of how good the typography is. An
asymmetric layout (text block offset, `SwarmField` or a live element given
real visual weight on one side) reads as considered, not generic, without
changing a single word.

**Wording — current:** *"Say what you need. Watch the swarm find it."*
Has decent rhythm, but "say what you need" is close to a stock AI-product
tagline at this point — nearly every conversational-AI tool's hero says a
version of it. It doesn't name what's actually different about this one.

**Suggested direction (adapt freely, this is a starting point not a
mandate):** name the mechanism, not the genre. Something like *"Five
specialists read your code. Every finding, a literal quote."* — trades
generic "AI takes instructions" framing for the actual differentiator
(evidence-verified findings from Bob's real Agent mode, not paraphrased
guesses).

**Emphasis:** the gold-gradient italic span currently highlights *"Watch
the swarm"* — the least distinctive phrase in the sentence. If you change
the wording, put the gold treatment on whatever's actually the hook (the
evidence/verification part), not the generic "watch."

## 3. The flow — reduce empty-state scroll, add auto-scroll on dispatch

Right now: Hero → Swarm → Report → History, four full-height sections
always present in one continuous scroll.

- **Before any run exists**, a first-time view shows three consecutive
  empty-state cards stacked below the hero ("waiting on a task," "report
  assembles here," "no runs yet") — reads as unfinished rather than
  confident. Worth collapsing Stage 2/Report to something more minimal
  until a run actually exists.
- **No auto-scroll on dispatch** — after clicking "Dispatch the swarm," the
  user has to manually scroll or click "Swarm" in the nav. For the actual
  demo recording specifically, an auto-scroll into the Swarm section the
  moment a run starts removes an awkward manual step.

## 4. Smaller, additive polish (not required, worth it if time allows)

- **`SwarmField` reactive to real events.** It's currently a fixed ambient
  backdrop (seeded random dots, always animating the same way). Since
  `useSwarmRun` already has the live `progress`/`finding` event stream,
  having the field pulse/brighten in sync with real events turns it from
  decoration into an actual live status visualization.
- **Evidence needs code styling, not paragraph styling.** `ReportView`
  currently renders each finding's `evidence` as plain text. It's literally
  quoted source code — a monospace block with a subtle background would
  say "this is real extracted code" far more clearly than a sentence does.
- **Severity should carry visual weight, not just badge color.** A
  `breaks` finding and an `informational` one are the same size today. A
  left accent border or slightly larger card for `breaks` guides the eye to
  what matters first.
- **Zero-findings needs an explicit "clean" state.** A completed run with
  no findings currently renders nothing in the Report section. "0 findings
  — clean pass" is a legitimate good result worth designing for, not an
  edge case to leave blank.
- **Full run-ID copy affordance.** The dashboard shows only the first 8
  characters of a run ID. For the manual runId-bridging workflow (see
  `docs/LAUNCH_GUIDE.md` §2a), a small "copy full ID" button would remove
  real friction during a live demo.

None of the above is structural — all additive, all optional beyond the
font fix, which is the one genuinely load-bearing item.

---

## Prompt — paste this into Bob to work through the list above

```
Read docs/ARISHA_FRONTEND_POLISH.md first — full context on what's being
fixed and why, written by the backend engineer after reviewing the actual
frontend code. Read docs/LAUNCH_GUIDE.md too if you hit any connection
errors while testing — it's almost certainly the backend not running
locally, not a frontend wiring problem (that's already done).

Work through it in this order, since #1 has the highest visual impact for
the least effort:

1. Fix the font loading bug (§1) — add the Google Fonts <link> tags to
   index.html's <head>. Verify by checking computed styles in devtools
   show Fraunces/IBM Plex Mono/Inter actually applied, not falling back to
   Georgia/system-ui.
2. Hero.tsx: adjust positioning away from fully-centered (§2), and revise
   the heading wording to name the actual differentiator (evidence-verified
   findings) instead of generic "AI takes instructions" framing — the doc
   has a suggested direction, not a mandate, make it your own.
3. Reduce the empty-state stacking before any run exists, and add
   auto-scroll into the Swarm section on dispatch (§3).
4. If time allows, the additive items in §4 — SwarmField reactivity, code-
   styled evidence blocks, severity visual weight, a zero-findings clean
   state, and a full-run-ID copy button.

Push and open a PR when done — same branch+PR pattern the rest of the team
has been using (docs/CONTRIBUTING.md). Tag it for review, don't merge it
yourself if it touches anything outside frontend/.
```

