# Contribution Log — copy this into your folder as `CONTRIBUTIONS.md`

> One entry per Bob session (or per distinct chunk of work within a longer
> session). Write it immediately after, not at the end of the hackathon —
> this becomes the raw material for the D3 "how IBM Bob was used" written
> statement, so write each entry like you're explaining it to a judge who
> wasn't in the room.

---

## Entry template (copy this block per session)

```markdown
### Session N — <short title> — <date, SAST time>

**Task given to Bob:** <the literal prompt/task description you gave it>

**What Bob actually did:**
<Concrete, specific steps — which tools it called, which subagents it
spawned, what it read, what it decided. Not "Bob helped me build the
backend" — instead: "Bob called list_project_files against
demo/sample-project, then spawned the debugger and data_lineage subagents
in parallel, each of which called read_project_file on app.py and
utils.py before calling record_finding.">

**Why this mattered / what it solved:**
<The actual problem this session addressed — a bug, a design decision, a
piece of the workflow that would have taken longer by hand. Be specific
about the "before" if you can — this is where a measured before/after
number belongs if you have one.>

**Evidence:**
- Screenshots: `NN-description.png`, `NN-description.png` (in this folder)
- Recording (if captured): <unlisted YouTube/Drive link>

**Anything that went wrong:**
<Optional but valuable — a failure and how it was resolved is often more
convincing than a clean success. If nothing went wrong, say so rather than
omitting the section.>
```

---

## Important — this log is for genuine Bob sessions only

Only log work that actually happened inside IBM Bob's Agent mode. Backend/
frontend/etc. work done through another tool (an IDE, a different AI
assistant, manual coding) is real project work and belongs in commit
history and `HANDOVER.md` — but it is **not** Bob-usage evidence, and
logging it here as if it were would misrepresent what tool did the work.
The Official Rules PDF disqualifies submissions that "appear not to have
been submitted honestly and in good faith" — don't create that risk over
something this avoidable. If your folder is empty because you haven't
opened Bob yet, leave it empty until you do.

## Why this exists

The Official Rules PDF requires "an exported IBM Bob report of all relevant
tasks/sessions used for the contest" and the site requires "each team
member's screenshots of IBM Bob task session summaries" — both are about
*proving* Bob was used. This log is about capturing *why it mattered*, which
neither the screenshots nor the raw exported report do on their own, and
which the D3 written statement explicitly asks for: "Provide clear and
specific details on how and where your team used Bob... Be specific."

Five people keeping this log as they go turns D3 into an editing job on
Sunday instead of a from-scratch writing job under deadline pressure.
