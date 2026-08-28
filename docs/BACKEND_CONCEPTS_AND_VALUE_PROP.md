# Backend Concepts, Value Proposition, and Stretch Ideas

> **For:** Bob, reading this at the start of a backend session, and Lethabo,
> as a reference. This explains *why* the backend is built the way it is —
> not just what the code does — so additions stay consistent with the
> reasoning instead of drifting from it.
>
> **Written:** 2026-08-28, before live Bob testing began.

---

## 1. MCP (Model Context Protocol) — what it is, why it's used, how to use it well

MCP is the wire between "Bob decided to do something" and "something real
happened." Without it, Bob's Agent mode can only narrate in chat — "I looked
at the file and I think X breaks" — which is unverifiable and exactly what
the hackathon's judging criteria push against: "not just assist with coding,"
"how clear is the application of IBM technology." MCP tool calls are the
concrete, inspectable trail that proves structured work happened, and it's
what the exported Bob session report will actually show as evidence.

**Why it's the right integration point, not just a possible one:** Bob's
Agent mode and `spawn_subagent` are the reasoning engine (see
`docs/CRITICAL_DECISIONS.md` — the team deliberately does not build a
separate multi-agent system). MCP is how that reasoning engine gets bounded,
structured access to this specific repo's tools instead of improvising.

**Using it well, concretely, in this repo:**
- Tools are split by concern (`tools/git.js`, `tools/filesystem.js`,
  `tools/swarm.js`) — one responsibility per file, which keeps Bob's
  tool-selection reasoning simpler than one large multi-purpose tool would.
- `record_finding` *requires* a literal evidence string (`store.js` throws on
  empty evidence) — this enforces the extract-don't-infer rule in code, not
  just as a prompt instruction Bob could drift away from over a long session.
- Two transports, deliberately: MCP-over-stdio to Bob (its native transport),
  a separate HTTP+WS side-channel (`events-server.js`) to the browser. Don't
  make Bob talk WebSocket directly — the events bridge translates for the
  parts of the system that aren't Bob.
- **If adding a new tool:** follow the existing pattern — narrow purpose,
  Zod schema for inputs, and if it writes state, decide explicitly whether it
  should also `publish()` an event for the live dashboard (swarm tools do;
  git/filesystem tools currently don't, since they're reads, not swarm
  progress).

---

## 2. API integration — what it means here, and the strongest version of it

Two distinct things fall under "API integration" in this project:

1. **The events API** (`events-server.js`) — already built: `POST /runs`,
   `GET /runs/:id`, `GET /runs/:id/report`, `WS /runs/:id/events`. This is
   what lets the browser dashboard show real swarm activity instead of
   `simulateSwarm()`'s fake timers.
2. **Git integration** (`tools/git.js`, via `simple-git`) — wraps local git
   as callable MCP tools. Written, not yet tested live.

**The strongest version, if there's time — a genuine differentiator, not
just more code:** GitHub's actual API (`octokit`), not just local git.
Currently `git_diff`/`git_log` only see a local clone. A real GitHub API
integration would let a subagent read an **actual PR's diff** directly from
GitHub and post findings back as a **PR comment**. That's the difference
between "a tool that works on a folder you point it at" and "a tool that
plugs into the workflow developers already live in" — and it's a direct line
back to the team's original PR-triggered idea. Scoped down for a demo: a
one-off script that fetches one real public PR's diff and feeds it through
the swarm is enough to show the concept without needing a live webhook
listener running during judging.

---

## 3. File system operations — what and how

`list_project_files`, `read_project_file`, `project_summary` give Bob's
subagents bounded read access to whatever repo BobSwarm is pointed at.
`project_summary` exists specifically so a subagent can orient itself (file
counts, sizes, likely entry points) without reading every file first.

**Mechanically:** `glob` for listing, `fs/promises` for reading. Already
fixed: `glob` returns native backslash paths on Windows, which would have
silently mismatched `affected_path` values a subagent quotes elsewhere —
normalized to forward slashes at the source (`filesystem.js`).

**Not yet done, worth 10 minutes before Sunday:** no boundary check stops a
path from escaping the intended project root. Low risk against your own
fixture repos, but "we thought about this" is a legitimate thing to have
ready if design/security comes up in Q&A.

---

## 4. Background tasks — what and how

Two things currently qualify:

1. **Timeout safety net** (`store.js`'s `armTimeout`) — a run stuck
   `running` for 5+ minutes force-finalizes with whatever findings exist.
   This is what stops a demo from freezing mid-recording.
2. **Event fan-out** — `record_finding`/`record_progress` publish to
   WebSocket subscribers off the main tool-call path, so a Bob tool call
   returns immediately rather than blocking on the browser.

**Deliberately not built:** a real job queue (Redis/Bull/etc.) — unnecessary
infrastructure for a 48-hour PoC, and one more service that could fail live
during judging. `setTimeout` + in-memory state is the right amount of
"background task" for this scope. Don't add a queue unless a concrete need
appears that the timeout alone can't cover.

---

## 5. Ideas that could genuinely land as "wow" — picked for effort vs. impact

Two, not ten — Bobcoins and time are both finite, and both of these extend
things already built rather than starting new subsystems:

1. **A live "trust score" on the report.** The Reviewer persona
   (`agents/`, or the `reviewer.yaml` concept) already exists to catch
   fabricated evidence. Surface it visibly on the dashboard: *"7 findings,
   7 verified, 0 unsupported."* Small UI addition (Arisha) plus making sure
   the Reviewer's cross-check output is distinctly wired through. This is a
   direct, honest demonstration of the team's own doctrine (extract, don't
   infer) running *inside the product*, not just followed while building it —
   most teams won't show a swarm checking its own work.
2. **GitHub-triggered runs** (§2 above). Even the scaled-down version (fetch
   one real PR's diff, run the swarm on it, show the finding) makes the demo
   land as "plugs into how I already work" rather than "works on a folder."

---

## 6. The problem statement — sharpened for D2/D3

Tied explicitly to the judging language ("Effectiveness and efficiency: does
it achieve a measurable impact... can it scale") and the overview's own ask
("Clearly demonstrate impact by showing how your solution increases
productivity, reduces manual effort, errors, and rework, or significantly
shortens the time required"):

> Investigating a multi-step engineering task — "what breaks if I change
> this," "get me oriented in this module," "review this for risk" —
> normally means one developer working sequentially: read files, form a
> hypothesis, check it, write it up. BobSwarm turns that into parallel,
> structured investigation: Bob's own Agent mode decomposes the task and
> dispatches role-specific subagents simultaneously, each required to cite
> literal evidence for every claim, cross-checked by a dedicated Reviewer
> agent before the report reaches the developer.

**Do not put a specific time-saved number in the pitch without
Mmopiemang's timing harness behind it.** That's an uncalibrated claim — the
exact thing that falls apart under a judge's "how did you measure that."
Once the harness runs against a real fixture, the real number goes here and
becomes the strongest line in D2.

---

## 7. Git workflow — Bob should do this automatically, not just when reminded

Every Bob session working in this repo should, without being asked each time:

1. **Pull before starting:** `git pull --rebase origin main` (or the current
   feature branch) before making any changes, so work starts from the latest
   state — other team members are pushing throughout the hackathon.
2. **Commit and push after each meaningful unit of work** — not just at the
   end of a long session. Follow the team's commit convention
   (`docs/CONTRIBUTING.md`): `<type>(<scope>): <short description>`, types
   `feat`/`fix`/`docs`/`refactor`/`test`/`chore`.
3. **If a push is rejected** (someone else pushed first):
   `git pull --rebase origin <branch>`, resolve any conflicts, push again.
   Never force-push to `main`.
4. **Stage specific files**, not a blanket `git add -A`/`.` — review what's
   about to be committed, especially checking nothing in `.gitignore`
   (`.env`, keys, `node_modules/`) is being swept in by accident.
5. **For anything touching another team member's owned area**
   (`frontend/`, `agents/`, `orchestrator/`, `.bob/` — see
   `docs/CONTRIBUTING.md`'s ownership map), prefer a feature branch + PR
   over a direct push to `main`, same as the pattern already used for PR #1.
   For small, non-conflicting changes within your own owned area
   (`mcp-server/`) or shared docs, a direct push to `main` is fine — that's
   also the pattern already in use.

The goal: the repo should never be more than one session behind what's
actually true, in either direction — Bob shouldn't work from stale state,
and the team shouldn't have to wait for a human to remember to push.
