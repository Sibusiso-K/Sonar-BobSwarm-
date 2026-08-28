# Literal Rules Specification — IBM TechXchange 2026 Pre-conference Dev Day Hackathon

> **Compiled/updated by:** Lethabo (Backend Engineer)

Extracted by a rules-lawyer pass over: (1) the competition overview page, (2) the
"Complete the hackathon" page, (3) the Official Rules PDF (15pp). The PDF's own
precedence clause governs conflicts: **"IN THE EVENT OF A DISCREPANCY BETWEEN ANY
INFORMATION AND/OR COMMUNICATION, THESE OFFICIAL RULES SHALL GOVERN."** Every
conflict below is already resolved toward the PDF.

For the digested, action-oriented version, read 01-CRITICAL-DECISIONS.md first —
this file is the full backing detail.

---

## Timeline (ET verbatim, SAST = ET+6h)

| Event | ET | SAST |
|---|---|---|
| Team-building opens | Aug 27, 4:00 PM | Thu 27 Aug, 22:00 |
| Registration closes | Aug 28, 9:00 AM | Fri 28 Aug, 15:00 |
| Hackathon start | Aug 28, 10:00 AM | Fri 28 Aug, 16:00 |
| **Submissions close** | Aug 30, 10:00 AM | **Sun 30 Aug, 16:00** |
| Bob access ends | Sep 1 | — |
| Cloud account closes | Sep 1, EOD | — |

PDF: "Last call for submission of a team's entry must be received by the Sponsors
on or before 10:00 AM ET on August 30, 2026, or the Participant's entire team
entry may be disqualified." Deadline is *received by*; the Sponsor's clock is
authoritative, not yours. "All dates and times are subject to change in Sponsors'
sole discretion."

## Deliverables (PDF p.4, all four mandatory)

> "Each Submission must include the following deliverables: 1. Video demonstration
> of the team's solution, including how IBM Bob was used 2. Written problem and
> solution statements 3. Written statement on how IBM Bob was utilized 4. Working
> code repository or evidence of technology proof-of-concept solution, including
> exported IBM Bob report of all relevant tasks/sessions used for the contest"

Submitted via the "My Team" page → Submissions section, not email or a separate form.

**D1 — Video:** "Three minutes is the maximum length. Judges will not watch more
than 3 minutes." At least 90s must be live on-screen demo. Must narrate. Must show
Bob usage clearly. Host on YouTube/Vimeo/Google Drive for automated pre-check
feedback; other hosts still qualify for judging but get no automated feedback.

**D2 — Problem/solution statement:** ≤500 words. Must include: the problem, what
the solution is + target users + how they interact with it, why it's creative/
unique, how it addresses the issue in a way judges haven't seen. (PDF phrases this
as "statements," plural, vs. the site's single text field — no practical
consequence identified, the site's form is what actually exists.)

**D3 — Bob usage statement:** "Provide clear and specific details on how and where
your team used Bob. If applicable, also describe how your project uses IBM
watsonx.ai or watsonx Orchestrate. Be specific." **No word limit stated anywhere.**

**D4 — Code repository:** Public GitHub/GitLab/Bitbucket link. Must include
"each team member's" Bob task-session screenshots — five sets, not one. PDF also
requires an "exported IBM Bob report of all relevant tasks/sessions" — produce
both the screenshots and the exported report; it satisfies either reading and
costs little extra. Optional IBM hackathon repo template available with
`.gitignore`/`.bobignore` credential-leak safeguards.

**Credential warning, verbatim:** "If IBM Cloud credentials (API keys, passwords,
or other sensitive secrets) are detected in your repository through IBM security
monitoring, your IBM Cloud account may be suspended immediately."

## Judging rubric (verbatim, max 20, average of judges' scores)

| Criterion | Points | Sub-questions (verbatim) |
|---|---|---|
| Completeness and feasibility | 5 | "How feasible is the solution? How fully has the idea been thought-out and planned? How complete is the proof-of-concept submitted? How clear is the application of IBM technology?" |
| Creativity and innovation | 5 | "How unique and original was the approach in applying AI technology to address the stated issue? Is the solution differentiated in the market?" |
| Design and usability | 5 | "How good is the design, user experience, and ease-of-use of the solution? How quickly and easily could it be put to use in real-world scenarios and adopted by target users?" |
| Effectiveness and efficiency | 5 | "Does the solution address a high priority and relevant issue within the hackathon theme? Does it achieve its goal effectively and efficiently? Can it achieve a measurable impact in the field? Does it have potential to scale to more users or use cases?" |

**Qualifying floor (PDF p.8 only — not on either web page):** "A Submission must
receive a minimum score of 12.5 points for prize consideration." = 62.5%,
averaging 3.125/5 per criterion. Flat weighting — no criterion to over-index on,
and zeroing any one of the four is the real risk, not underperforming evenly.

PDF p.7 also adds an extra layer beyond the four criteria: "the final score being
the average of the judges' scores **and an assessment of the team's submitted
deliverables**" — deliverable completeness itself factors in, separate from
content quality.

## Hard constraints

- **Theme (verbatim):** "Create a solution that improves a specific developer
  workflow, such as onboarding, debugging, code review, testing, application
  maintenance, or release and deployment processes." + "Leverage features like
  Agent mode, parallel tasks, subagents, and document understanding to manage and
  improve multiple steps, **not just assist with coding**."
- **Bob is mandatory:** "All Submissions are required to make use of IBM Bob to be
  eligible for Prizes."
- **Language:** "Submissions must be in English."
- **Team size:** 1-5 people; this team is at the cap of 5.
- **One team, one entry per participant:** "Limit one (1) entry per
  Participant/team." Working on a second team or a solo side-entry voids both.
- **Bobcoins:** 40 per person, non-replenishable, applied automatically —
  "Once your Bobcoin reaches 100% usage, no additional Bobcoins will be provided."
  200 total across the team; the site recommends dividing tasks to use the full
  pool deliberately.
- **IBM Cloud (optional, shared):** one account for the whole team, ~2 hour
  activation lag after request — request early if watsonx.ai/Orchestrate is in
  scope at all, even as a maybe.
- **Data rules (verbatim):** "Data from public websites may be used, if the terms
  allow for commercial use, but please keep a list of the websites you use. Do not
  use any client data, data containing personal information, or data obtained from
  social media."
- **Third-party technology (PDF p.11):** must abide by all licence terms of any
  third-party technology used, including payment terms. "Your team will be
  disqualified if the Sponsors has any reason to believe that your team has
  violated the terms of this paragraph." Low evidentiary bar, severe consequence.
- **Employer disclosure (PDF p.5):** each participant must disclose their
  employer or affiliated organisation (e.g. university). No dedicated field exists
  in the site's submission flow — put it in D3, or ask mentors where it belongs.
- **Employment/contract compliance (PDF p.3):** each participant is individually
  responsible for confirming participation doesn't violate any existing employment
  or other contract (IP assignment clauses, etc.) before registering.

## Eligibility (PDF pp.2-3)

- 18+ (or age of emancipation in the relevant jurisdiction).
- Void where prohibited by law or in U.S.-embargoed countries. South Africa is not
  embargoed; no country-specific bar identified for this team.
- Excluded: IBM Group (including Red Hat) employees/officers/directors; government
  agency staff; agencies/entities involved in organizing/administering the event
  (including BeMyApp); immediate family of any of the above, or anyone in the same
  household.
- Carve-out: students employed part-time/work-study by their own educational
  institution remain eligible.
- **Team-wide contagion:** "If any member of your team is ineligible or otherwise
  fails to comply with these Official Rules, the team as a whole may be
  disqualified at the Sponsors' sole discretion." Confirm all five members clear
  this before the first commit.

## The Swarm_Corp originality question — quoted in full, unresolved by the source text

**Against reusing it as the Submission's core:**

> "The Submission, in whole and in part, is original work of Participant, is
> original to the Contest (i.e. was not developed in any substantive form/format
> prior to the Contest), does not violate or infringe upon any laws, rules,
> regulations, proprietary or intellectual property rights..." (PDF p.5)

> "Sponsors reserve the absolute right in their sole discretion to disqualify as
> ineligible Submissions... were developed in a substantive form/format prior to
> the Contest..." (PDF p.8)

**For allowing it as a disclosed dependency:**

> "Your team may bring to the Event any pre-developed or licensed Technology that
> you plan to use in connection with your prototype, provided that such
> Technology meets the requirements of this paragraph." (PDF p.11)

Plus the site: "we ask that you do not set anything up or start working on your
project in IBM Bob ahead of time" and "You must build your solution during the
duration of the hackathon."

**This project's resolution (see 01-CRITICAL-DECISIONS.md §1 for the reasoning):**
BobSwarm's actual multi-agent execution runs on Bob's own native Agent mode and
subagents, not on Swarm_Corp's code. Swarm_Corp is not a dependency the Submission
runs on. This avoids the conflict rather than betting on a reading of it — the
adjudication standard throughout the PDF is "Sponsors' sole discretion," which is
not a standard worth arguing a legal interpretation against after the fact.

Also relevant independent of the originality question: Swarm_Corp's "free LLM
provider APIs" would trigger the third-party-licence-terms obligation above if any
part of it were used — another reason the clean build avoids more than one risk
at once.

## Disqualifiers (verbatim, selected)

- Late arrival past the "received by" deadline.
- Post-deadline edits: PDF — "Once committed, an entry may not be cancelled or
  deleted, enhanced, added to, or improved." Practical rule: treat the first
  complete submission as final; freeze the repo before the deadline, not at it.
- Prior-development, per the Swarm_Corp discussion above.
- Third-party licence or IP-grant violations ("any reason to believe").
- "Unsuccessful, exploitational, fraudulent, misleading, harmful, non-functioning,
  invalid, non-compliant, incomplete entries in whole or in part or those not
  deemed to be submitted in good faith."
- Content bars: no malware; no pornographic/sexually-explicit/defamatory/
  offensive/violent/harmful/discriminatory/cruel/abusive/highly-political/
  religious/sensitive content; nothing disparaging IBM, the event, or any person
  or entity.
- Must attend and complete the entire Contest to be prize-eligible.
- Catch-all: Sponsors may disqualify "for any reason in its absolute discretion,"
  at any time before, during, or after the Contest.

## Ownership and licensing (PDF pp.10-11, verbatim)

> "Participants own the rights to the Submission they create during the Contest,
> subject to any rights owned by third parties and your employer and license
> terms of the underlying Technology used in the Submission."

> "You and all Participant(s) grant Sponsors a perpetual, fully paid up,
> irrevocable, nonexclusive, worldwide license to your/their Submissions,
> including the right to use, have used, execute, display, reproduce, make, have
> made, perform, disclose, prepare derivative works from, and distribute, sell,
> offer to sell, import, have imported and transmit their project and derivative
> works therefrom for any purpose, and the right to sublicense others to do any or
> all of the foregoing."

You keep ownership and can still commercialize the work (licence is nonexclusive),
but IBM/BeMyApp can also use, modify, and sublicense it forever, for any purpose,
at no cost to them. This grant would apply to Swarm_Corp too if it were
incorporated — one more reason to keep it out of the Submission rather than a
minor detail. Governing law: New York; exclusive jurisdiction: New York courts.
Sponsors may also use the Submission for promotional purposes without further
notice or compensation. Sponsors will not arbitrate internal team disputes over
credit, contribution, or IP ownership between members.

## Open gaps — not resolved by the source text, don't guess

1. No word limit stated for D3 (Bob usage statement).
2. "Screenshots" (site) vs. "exported report" (PDF) are different artifacts —
   produce both.
3. Hackathon guide (not yet read) may define the screenshot-capture method and
   contain further binding setup steps — download and read at kickoff.
4. Edit-after-commit rules conflict between PDF and site — PDF governs; treat the
   first final submission as the only one.
5. Criterion ordering differs slightly between the overview page and PDF pp.7-8 —
   weights are identical (5 each); no scoring consequence identified.
6. 12.5-point floor appears only in the PDF, on neither web page — binding
   regardless, per the precedence clause.
7. Employer-disclosure requirement has no dedicated field in the site's
   submission flow.
8. Judging period length, judge panel size, and tie-break rules are not stated
   anywhere in either source.
9. "End of day September 1" (Cloud account closure) — timezone not specified;
   treat ET as the safe assumption and export everything before that morning SAST.
10. Final repo URL (`Sonar-BobSwarm-`) has not been confirmed by any official
    source as the one going into the submission form — confirm with the team.
11. Contest dates are explicitly "subject to change in Sponsors' sole discretion"
    — re-check the site before the final submission window, don't rely solely on
    this document at the last moment.
