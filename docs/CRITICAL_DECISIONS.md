# Critical Decisions — Read Before Building Further

> **Compiled/updated by:** Lethabo (Backend Engineer)
> **Last updated:** 2026-08-28 — §5a resolved in live Bob session; MCP registration confirmed working.

Full verbatim backing for everything here: [`RULES_SPEC.md`](RULES_SPEC.md).

## 1. Swarm_Corp — do not depend on it in the Submission

**The conflict, quoted from the Official Rules PDF (governs over the hackathon
website per its own precedence clause):**

> "The Submission, in whole and in part, is original work of Participant, is
> original to the Contest (i.e. was not developed in any substantive form/format
> prior to the Contest)..." (p.5, warranty)

> "Sponsors reserve the absolute right in their sole discretion to disqualify as
> ineligible Submissions... were developed in a substantive form/format prior to
> the Contest..." (p.8, enforcement)

versus a separate clause allowing pre-developed Technology as a *dependency*
(p.11). The adjudication standard throughout is "Sponsors' sole discretion" —
not something worth betting the whole team's entry on a favorable reading of.

**Resolution this build uses:** BobSwarm's actual multi-agent execution is Bob's
own native `spawn_subagent` / Agent mode, orchestrated by `orchestrator/system_prompt.md`
and `orchestrator/decompose.js`, both written during the Contest window. No code
in this repo calls into or depends on Swarm_Corp. Swarm_Corp may be mentioned as
prior inspiration in the pitch/written statements if useful, but it is not part
of the Submission's codebase or demo.

**Action taken:** removed the "Built On... Swarm_Corp architecture" line from
README.md's "Built On" section (was present as of the initial scaffold commit,
`df6c197`) — that phrasing is exactly the kind of evidence a "developed prior to
the Contest" reading would point to. If the team disagrees with this framing,
raise it before more work builds on the assumption either way — reverting the
README line is trivial, reverting an architecture built to depend on Swarm_Corp
mid-hackathon is not.

**Recommended, still outstanding:** send the organiser a written question
confirming this reading and keep the reply. Not blocking — the build already
avoids the risk regardless of the answer.

## 2. The scoring floor

> "A Submission must receive a minimum score of 12.5 points for prize
> consideration." (PDF p.8 — **not on either web page**, easy to miss)

Rubric is flat: 4 criteria × 5 points, 25% each. No criterion to over-index on;
the failure mode is zeroing one, not underperforming evenly across all four.
**Design and usability** is the likely weak axis for an agent-orchestration
project — protect real build time for `frontend/`, it's a quarter of the score,
not polish.

## 3. Deadlines

- Contest Period: Fri 28 Aug 16:00 SAST → Sun 30 Aug 16:00 SAST (10:00 ET both ends).
- Deadline is "received by," and the Sponsor's clock is authoritative — build in
  margin. **Target final submission 12:00 SAST Sunday**, four hours of slack.
- PDF vs. site conflict on edits after submitting — PDF governs: "Once committed,
  an entry may not be cancelled or deleted, enhanced, added to, or improved."
  **Treat the first complete submission as final.**
- **No repo commits after 16:00 SAST Sunday.** A late "quick fix" commit is a
  visible, timestamped rule breach on a public repo.

## 4. Deliverables checklist (all four mandatory)

- [ ] Video ≤3:00, ≥90s live on-screen demo, narrated, shows Bob usage clearly.
      Host on YouTube/Vimeo/Drive for automated pre-check feedback.
- [ ] Problem/solution statement, ≤500 words.
- [ ] Bob usage statement — no stated word limit, be specific about tool calls,
      custom mode, skill, and orchestration steps actually used.
- [ ] Repo: public link + **every team member's** Bob task-session screenshots
      (`docs/bob-sessions/<name>/`, not yet created — set this up early) + the
      exported Bob task/session report. Produce both artifacts, not just one.

## 5a. Bob MCP Registration — **RESOLVED** (was the biggest unknown)

> Previously listed as "unconfirmed" in the handoff doc and HANDOVER.md.
> Confirmed in the first live Bob session on 2026-08-28.

**How Bob exposes MCP server registration:**

Bob provides two config file paths — no settings UI required, though there is
one (Settings → MCP tab → "Edit Project MCP" / "Edit Global MCP"):

| Level | File | Scope |
|---|---|---|
| Project | `.bob/mcp.json` in repo root | This workspace only |
| Global | `~/.bob/mcp.json` | All workspaces on this machine |

Project-level takes precedence when names conflict. **We use project-level** —
but `.bob/mcp.json` itself is **not** committed (see below), only its template.

**The config that was written (`.bob/mcp.json`):**
```json
{
  "mcpServers": {
    "bobswarm": {
      "command": "node",
      "args": ["mcp-server/server.js"],
      "cwd": "C:\\Users\\USER\\Desktop\\IBM 2.0\\bobswarm-repo",
      "alwaysAllow": [
        "git_status", "git_log", "git_diff", "git_blame",
        "list_project_files", "read_project_file", "project_summary",
        "write_swarm_report", "record_progress", "record_finding",
        "finalize_run", "get_run_report"
      ]
    }
  }
}
```

**Updated after first commit:** the `cwd` path is absolute and machine-specific
— committing it as-is would silently break every other team member's session
the moment they pull `main` (their local clone almost certainly isn't at
`C:\Users\USER\Desktop\IBM 2.0\bobswarm-repo`). Fixed the same way `.env` is
handled: `.bob/mcp.json` is now git-ignored, and `.bob/mcp.json.example` is
committed instead with a placeholder `cwd`.

**Every team member, once, before opening Bob:**
```bash
cp .bob/mcp.json.example .bob/mcp.json
# then edit .bob/mcp.json and replace the placeholder cwd with your own
# absolute path to this repo's local clone
```
The `alwaysAllow` list covers all 12 tools — eliminates per-call approval
prompts, which would break the automated swarm flow. Don't remove entries from
it without telling the team; a tool silently requiring per-call approval mid-
demo is a bad live moment.

**What the handoff doc §5a guessed:** shape was correct (same as Claude Desktop).
File name was the only unknown — confirmed as `.bob/mcp.json`, not `settings.json`.

**12 tools confirmed visible (live Node verification):**
`git_status`, `git_log`, `git_diff`, `git_blame`, `list_project_files`,
`read_project_file`, `project_summary`, `write_swarm_report`,
`record_progress`, `record_finding`, `finalize_run`, `get_run_report`

**`project_summary` against `demo/sample-project` — actual output:**
```json
{
  "totalFiles": 3,
  "totalSizeKB": 7,
  "filesByExtension": { ".py": 2, ".json": 1 },
  "likelyEntryPoints": ["app.py"]
}
```

**Update — second live session, still not connected, but the swarm ran anyway:**
MCP tools were confirmed *not* in Bob's active tool list this session (verified
honestly — Bob reported this rather than fabricating a tool call). Yet the
BobSwarm Orchestrator mode still successfully decomposed the task, spawned
`SwarmDebugger` and `SwarmDataLineage` **in parallel** (same tool-call turn,
matching `decompose.js`'s `parallel: true` for both), and every finding used a
**literal, verbatim, line-accurate quote** from the actual source file — zero
paraphrases across all findings checked.

**What this means, precisely:** the swarm ran via Bob's *native*
`spawn_subagent` and built-in file reading, not through this repo's MCP
tools (`get_repo_snapshot`, `record_finding`, etc.) — the exact fallback path
described above ("Bob's Agent mode can call read_project_file-equivalent
actions using its own built-in file tools, and subagents can report findings
in a fixed markdown format in chat instead of via record_finding"). This is
genuinely good news for the demo's core value — orchestration, parallelism,
and evidence discipline all work — **but it means the MCP layer (structured
storage, live dashboard, deterministic aggregation) has not yet been
exercised by a live swarm run.** Don't write D3 claiming the MCP tools power
the live demo until a run has actually gone through them — say what's true at
the time of the final demo, not what was designed to be true.

Diagnosed why MCP still isn't connecting: not the same port-conflict bug (port
8787 confirmed free; `server.js` starts and logs cleanly when run directly
outside Bob). Most likely cause: Bob spawned the MCP server process once when
this session began, before the port-conflict fix and path-traversal fix
landed, and is holding a stale failed connection rather than retrying against
current code. Next action: use the refresh/reconnect control in Settings →
MCP tab, or reopen the project folder to force a fresh spawn.

**Findings vs. `demo/expected_output.md` (from this session, evidence-checked):**
- Debugger: 7 found, 7 expected — exact match.
- Data Lineage: 9 found, only 3 documented. Six additional real risks
  surfaced (SSRF via unchecked `api_url`, `get_results_summary` double-crash,
  undocumented depth-limit in `flatten`, deprecated API in `format_timestamp`,
  a `chunk_list` contract gap). **Mmopiemang should update
  `demo/expected_output.md`** — flagged, not edited directly (their owned
  file per `docs/CONTRIBUTING.md`).

**What still needs live-session verification (still open):**
- MCP tool calls from inside an actual Bob Agent session (not direct Node
  invocation, and not yet via Bob's native tools either — see above)
- `record_finding`'s structured schema actually being populated by a real
  subagent, through the MCP path specifically
- Live dashboard receiving real events (currently untestable until the above happens)

**Update — session count and one discrepancy worth correcting before D3 is
written:** Sibusiso ran a full 5-agent live session (`docs/bob-sessions/sibusiso/`,
20:55 SAST) — genuinely strong output (8 bugs, 7 refactor recs, full lineage
map, all evidence-backed). Sibusiso's own log still lists "verify record_finding
flows through stdio to the dashboard" as open, consistent with everything
above. **Separately, Mmopiemang's session log (`docs/bob-sessions/mmopiemang/`,
pushed 20:11–20:26 SAST) states subagents "called `record_finding` for their
domain."** Checked this against the timeline and the generated report:

- The commit that actually wires MCP tool calls into the orchestrator's
  system prompt (`efa72d2`, "wire MCP tool calls into system prompt") landed
  at **20:45 SAST — after** Mmopiemang's session was already pushed.
- The generated `demo/bobswarm-report-demo-sample-project.html` from that
  session contains **zero** occurrences of `record_finding`, `record_progress`,
  `MCP`, `mcp-server`, or `stdio` anywhere in the file.

Most likely explanation: this session also ran via Bob's native tools (same
pattern as every other session so far), and the "called `record_finding`"
line describes what the **persona instructions** say a subagent should do,
not something independently verified to have happened. Not raised as an
accusation — flagging because if this line goes into D3 unchanged, it's an
unverified claim about tool usage, and D3 is exactly the deliverable the
rules say must be "specific." **Mmopiemang should either verify this against
an actual MCP-connected session, or soften the log entry to match what's
demonstrable** — the swarm's actual output quality doesn't need the MCP claim
to be impressive on its own.

## 5b. MCP verification — RESOLVED, real evidence, not native fallback this time

The gap flagged repeatedly above (5a's "still open" list) is closed. A live
Bob session confirmed the actual stdio MCP path, not the native-tools
fallback every prior session used:

- `record_progress` called with `runId: "probe-test"` correctly round-tripped
  to `store.js`'s real error path (`Error: unknown run_id: probe-test`) —
  proves the call reached the actual store code, not a simulated response.
- `project_summary` returned the real JSON through the MCP tool call
  specifically (not a direct Node invocation).
- A full run (`runId: 20c55607-...`) dispatched two subagents in parallel —
  confirmed by overlapping `createdAt` timestamps in the stored findings
  (19:03:27 and 19:03:46, both mid-run, not sequential).
- Every stored `evidence` value checked against source: character-for-character
  literal quotes, including a 3-line verbatim span and a full docstring line.
  Zero paraphrases through the actual tool-call interface.

This resolves the open item tracked since 5a's first draft. The MCP layer is
real and working, not just designed to work.

**One real gap this session found, fixed:** `store.js`'s `finalizeRun` never
sent a `summary` field, but the frontend's `Report` type expected one
(`ReportView` would have rendered `undefined`). Fixed: `finalizeRun` and
`getReport` both now generate a deterministic one-line summary (counts only,
no LLM involved — "3 findings across 2 specialists — 1 breaks, 1 warns, 1
informational"). Also fixed in the same pass: `getReport` on an
already-complete run was skipping the sort `finalizeRun` applies, so the two
code paths could return findings in different order for the same run — now
identical (verified: `JSON.stringify` equal).

## 5c. Demo target has lost most of its planted bugs — RESOLVED (Option A taken)

> Resolved 2026-08-28 23:54 SAST, commit `692dc7f` (Sibusiso). Both
> `app.py`'s header comment and `demo/expected_output.md` now consistently
> describe the 2 bugs that actually remain (`enrich_record` None-propagation,
> unclosed file handles) — Bobalytics counts updated to match (3 bugs, 2
> refactorings, down from the stale 8/9). Verified: `npm run build` clean,
> no other file references the removed bug counts.

Original finding, kept for context:

Checked `demo/sample-project/app.py`/`utils.py` directly against the original
findings list. Of ~7-8 planted bugs, **5 are now fixed** — kept intentionally
so `test_app.py`'s new tests pass (div-by-zero, list mutation, email regex,
MD5, `merge_dicts` None-crash). Only **2-3 genuinely remain**: `enrich_record`'s
None-propagation crash (still real, still crashes `transform_record`
downstream) and the two unclosed file handles. `app.py`'s own header comment
still lists 5 "planted" bugs as present — 3 of them are not, right below that
comment.

This is `demo/`, Mmopiemang's owned area — not edited here. Needs a decision
before the demo recording:
- **Option A (fast, safe):** accept a smaller, honest 2-3-bug demo. Update
  the header comment and `expected_output.md` to match reality. Tests stay
  green, no more code changes needed.
- **Option B:** re-plant 2-3 replacement bugs elsewhere in the file to
  restore richness without touching the tested functions.
- **Option C (more work):** revert the fixes entirely, move `test_app.py` to
  test against a separate fixed-reference copy instead of the demo target.

No option is obviously wrong — this is a product/demo-design call, not a bug.

---

## 5. Bobcoins

40 per person, 200 team total, non-replenishable. Plan the call before opening
Bob for exploration — every wasted call is gone for the whole team.

## 6. Data sources

> "Data from public websites may be used, if the terms allow for commercial use,
> but please keep a list of the websites you use. Do not use any client data,
> data containing personal information, or data obtained from social media."

`docs/DATA_SOURCES.md` doesn't exist yet — whoever builds `demo/sample-project/`
further should log every source there from the first addition, including a note
if it's self-authored/synthetic rather than pulled from a public repo.

## 7. Eligibility

All 5 members must be 18+, not IBM/Red Hat employees, not immediate family of
event organisers, not from an embargoed jurisdiction. One ineligible member
disqualifies the whole team (PDF p.4) — confirm this in the team channel before
the final push.
