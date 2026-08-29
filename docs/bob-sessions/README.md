# Bob Session Screenshots

> **This folder is a mandatory submission deliverable.**
> From the Official Rules PDF: the code repository must include
> **"each team member's"** Bob task-session screenshots.
> Five people = five sets of screenshots. Not one, not combined — one folder per person.

---

## Instructions — every team member must do this

1. As you work in Bob, **take a screenshot after each meaningful action** (task created, swarm dispatched, report returned, etc.).
2. Save screenshots into **your named folder below**.
3. Name files clearly: `01-task-created.png`, `02-swarm-dispatched.png`, etc.
4. **Also keep a running contribution log** in your folder as you go — see
   "Writing the contribution log" below. Don't try to reconstruct it Sunday
   from memory; write one entry per session, same session, while it's fresh.
5. Push your folder before the submission deadline.

---

## When to capture — do this checklist every time you open Bob, not just once

Screenshots and log entries are cheap when captured in the moment and
expensive to reconstruct later. Treat opening Bob as the trigger:

- [ ] **Before you start:** screenshot the task/prompt you're about to give Bob.
- [ ] **At every distinct tool call or decision point** Bob makes that's
      relevant to your role (a subagent spawning, an MCP tool firing, a file
      being read, a finding being recorded) — screenshot it. Don't wait until
      the end and try to remember what happened.
- [ ] **When something fails or surprises you** — screenshot the error too.
      A "here's what didn't work and how we fixed it" entry is often more
      convincing to judges than a clean success, and it's honest.
- [ ] **At completion** — screenshot the final output/report.
- [ ] **Immediately after, while it's fresh:** add one entry to
      `CONTRIBUTIONS.md` in your folder (template below) describing what you
      just did, in plain language — this becomes raw material for the D3
      written statement later, so write it like you're explaining it to
      someone who wasn't there.

**Role-specific trigger points** (in addition to the general checklist above):

| Role | Capture specifically when... |
|---|---|
| Sibusiso (Orchestrator) | The constitution/system prompt causes Bob to decompose a task differently than expected; when `spawn_subagent` fires multiple agents in parallel (the parallelism is the point — capture it visibly, e.g. a timestamp showing overlapping agent activity) |
| Lethabo (Backend) | An MCP tool gets called successfully for the first time from inside a real Bob session; any tool-call failure and its fix (see `docs/LETHABO_BACKEND_HANDOFF.md` §7 for the ordered first-steps this maps to) |
| Farheen (AI/ML) | A persona produces a finding with real evidence vs. one that hallucinates/paraphrases (both are worth capturing — the contrast is a good D3 example of the extract-don't-infer rule actually working) |
| Arisha (Frontend) | The dashboard first receives a real (non-simulated) event from the events bridge; the final report rendering |
| Mmopiemang (Data/QA) | The fixture/demo project's planted issues get correctly found (or missed) by the swarm — this is your validation evidence |

---

## Screen recording (in addition to screenshots)

Screenshots prove Bob was used; a short recording proves the parallelism and
live behavior a still image can't show — this matters most for whoever's
capturing the demo-relevant flow (likely Sibusiso and/or whoever runs the
final end-to-end dry run), but anyone can record a session that shows
something genuinely useful to explain later.

- **What to record:** one focused session per person, max — not everything.
  Pick the run that best shows your role's Bob usage working end to end
  (e.g. Lethabo: an MCP tool being called live and a finding landing in the
  dashboard; Farheen: a persona being dispatched and returning structured
  findings).
- **Length:** a few minutes is enough. This is separate from and doesn't need
  to match the 3-minute submission video's constraints — it's supporting
  evidence, not the deliverable itself.
- **Where it goes:** don't commit raw video files to the repo — they bloat
  it and the main video deliverable already has to be hosted externally
  anyway. Upload each recording as **unlisted** on YouTube or Google Drive
  (same hosts the submission video should use, for consistency), and add the
  link to your `CONTRIBUTIONS.md` entry for that session, not as a separate
  untracked file.
- **When:** right after a session that actually shows something working —
  don't try to stage a recording after the fact. If a session goes wrong in
  an interesting way, that's still worth keeping (see the checklist above).

---

## Folders

| Folder | Person | Role |
|---|---|---|
| `sibusiso/` | Sibusiso | Lead / Orchestrator |
| `lethabo/` | Lethabo | Backend Engineer |
| `arisha/` | Arisha | Frontend Engineer |
| `mmopiemang/` | Mmpoiemang | Data / QA Engineer |
| `farheen/` | Farheen | AI/ML Engineer |

---

## Also required: exported Bob report

The PDF also requires an **"exported IBM Bob report of all relevant tasks/sessions"** —
this is different from screenshots. When you export the report from Bob, save it here as
`bob-exported-report.pdf` (or whatever format Bob exports).

The team lead (Sibusiso) should export the full session report covering the end-to-end
orchestration run and save it here before the final push.

---

## Deadline

All screenshots and the exported report must be in this folder and pushed to the repo
**before 12:00 SAST Sunday** (4-hour buffer before the 16:00 SAST submission close).
