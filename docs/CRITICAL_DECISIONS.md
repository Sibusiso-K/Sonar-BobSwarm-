# Critical Decisions — Read Before Building Further

> **Compiled/updated by:** Lethabo (Backend Engineer)

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
