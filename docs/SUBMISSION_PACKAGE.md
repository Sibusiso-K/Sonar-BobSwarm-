# BobSwarm Submission Package

> Final-copy working document for the IBM TechXchange 2026 Pre-conference Dev Day Hackathon.
> Verify the repository URL, video URL, team eligibility, employer disclosures, and every member's evidence before submitting.

## Rubric strategy

The official rubric is flat: four criteria worth five points each. BobSwarm must therefore demonstrate a complete proof of concept, differentiated use of IBM Bob, a polished operator experience, and measurable impact.

| Criterion | Evidence to show judges | Final gate |
|---|---|---|
| Completeness and feasibility | Bob custom mode, task decomposition, parallel subagents, MCP tools, live events, deterministic report | One uninterrupted golden-path run and a clean setup guide |
| Creativity and innovation | A Bob-native, observable swarm with evidence-gated specialist findings | Explain why this is more than a chatbot or single coding agent |
| Design and usability | Task form, honest Bob handoff, live role cards, timeline, reconnect recovery, report and run history | Record the real interface; do not use mock data |
| Effectiveness and efficiency | Five specialists, overlapping execution, literal source evidence, duration and severity counts | Display measured values from the recorded run, not estimates |

## D2 — Problem and solution statement

Software teams lose hours when a complex engineering question crosses several disciplines. A codebase audit may require debugging, documentation, refactoring analysis, onboarding knowledge, and data-lineage tracing. Today, developers either investigate these areas sequentially or prompt a general-purpose assistant repeatedly, then manually reconcile overlapping and sometimes unsupported answers. This creates slow handoffs, inconsistent evidence, and reports that are difficult to trust.

BobSwarm is an on-demand multi-agent engineering orchestrator built natively with IBM Bob. A developer describes the engineering outcome they need and selects a repository. BobSwarm decomposes the request into specialist tasks, loads purpose-built personas, and uses Bob's Agent mode and `spawn_subagent` capability to run independent investigations in parallel. A Debugger, Documenter, Refactorer, Onboarding specialist, and Data Lineage analyst each inspect the same repository from a different perspective.

Every reported finding must include literal source evidence. The specialists publish structured progress and findings through BobSwarm's Model Context Protocol server. A live React dashboard makes the normally invisible agent workflow observable: users can see each specialist's state, follow the event timeline, inspect severity-labelled evidence, and receive one deterministic unified report.

BobSwarm is differentiated from a conventional coding assistant because it coordinates and verifies multiple stages of an engineering workflow rather than producing one conversational answer. It preserves specialist accountability, exposes parallel work in real time, and prevents unsupported findings from entering the final report. In a recorded full-audit run, five specialists participated: four worked in the first parallel wave and the Refactorer followed the Debugger dependency. Together they produced 41 evidence-backed findings across five disciplines in approximately 94 seconds, with their first findings overlapping within a 15-second window.

The proof of concept targets developers, technical leads, maintainers, and teams onboarding onto unfamiliar repositories. Its architecture can extend to code review, release readiness, security analysis, test generation, and other multi-step developer workflows without changing the core orchestration model.

## D3 — How the team used IBM Bob

Bob was the execution and development environment for BobSwarm, not a decorative API call. The team created a BobSwarm custom mode and reusable skill that instruct Bob to interpret a developer request, run `orchestrator/decompose.js`, load the relevant specialist persona files, identify dependencies, and dispatch independent tasks through Bob's native `spawn_subagent` capability. The dashboard's selected `taskType` is authoritative: focused tasks select one specialist, while `full_audit` launches Debugger, Documenter, Onboarding, and Data Lineage in parallel, then supplies the Debugger's findings to the dependent Refactorer.

During live validation, Bob used the project's MCP tools to read repository files, inspect Git state, publish agent progress, and submit structured findings. Each `record_finding` call required a file path, target symbol, severity, and literal evidence; empty evidence was rejected. Bob then called `finalize_run`, which deterministically grouped and sorted the specialists' results and emitted the unified report to the dashboard. One recorded frontend-linked session used an existing dashboard run ID, dispatched all five specialists, published 59 live events, and completed with 41 evidence-backed findings across five roles. Four specialists formed the first parallel wave; the Refactorer followed the Debugger dependency.

Bob also helped the team build and validate the proof of concept during the contest. It was used to inspect project files in parallel, implement and review the MCP event bridge, exercise all twelve MCP tools over the live stdio transport, refine keyword routing against representative developer requests, verify the Debugger-to-Refactorer dependency, fix the sample pipeline and its unit tests, and produce reports and session evidence. The repository includes the system prompt, skill, persona definitions, task/session contribution logs, screenshots captured by team members, and the evidence exports supplied by the team so the judges can verify where Bob made decisions and what it produced.

BobSwarm uses IBM Bob Agent mode, parallel tasks, subagents, custom modes, skills, file and Git tooling, and MCP integration to manage an end-to-end developer workflow rather than merely assist with isolated code generation.

## Three-minute video storyboard

The live product section must occupy at least 90 seconds. Keep the browser, Bob, and terminal text large enough to read at normal playback speed.

| Time | Visual | Narration goal |
|---|---|---|
| 0:00–0:15 | Broken sample pipeline and one-line problem | Complex audits are slow and fragmented |
| 0:15–0:30 | BobSwarm architecture in the README | Bob decomposes one request into accountable specialists |
| 0:30–0:45 | Bob custom mode, skill, and MCP connection | Prove that IBM Bob is the execution engine |
| 0:45–1:05 | Dashboard task form and generated Bob handoff | Show the real operator workflow and full run ID |
| 1:05–1:35 | Paste the generated handoff into Bob; show `spawn_subagent` calls | Make parallel dispatch visible |
| 1:35–2:15 | Live dashboard role cards, timeline, evidence and completion | Show at least 90 seconds of live product interaction in total |
| 2:15–2:40 | Unified report and measured run summary | Five roles, duration, findings and literal evidence |
| 2:40–2:58 | Value and extension slide | Faster audits today; code review, release and security workflows next |

## Golden demo prompt

> Audit `demo/sample-project` end to end. Find defects, document the public API, recommend safe refactoring, trace the data flow, and produce an onboarding guide. Use the existing dashboard run ID shown in the handoff panel for every `record_progress`, `record_finding`, `finalize_run`, and `get_run_report` call. Read literal source before reporting findings, dispatch independent specialists in parallel, wait for the Debugger before the dependent Refactorer, and do not modify the demo fixture.

## Submission-day gates

### Machine-verifiable

- [x] `npm test` passes in `mcp-server/`.
- [x] Frontend lint, tests, and production build pass.
- [x] Orchestrator routing tests pass and fail on a deliberately wrong expectation.
- [x] Demo validation passes on Windows and POSIX systems.
- [x] A clean checkout can be started from the README without undocumented steps.
- [x] The backend serves the current `GET /runs` and snapshot/replay behavior.
- [ ] The working tree is clean and the public remote contains the final commit.

### Human evidence and compliance

- [ ] Every member confirms eligibility, employer/affiliation disclosure, and permission to participate.
- [ ] Every member's IBM Bob task-session consumption screenshots are present under root `bob_sessions/<name>/`.
- [ ] Matching Bob-exported task histories for all relevant sessions are present under root `bob_sessions/<name>/`.
- [ ] No credentials, personal information, client data, or unlicensed material is committed.
- [ ] The public repository URL is confirmed in the submission form.
- [ ] The final video is 90 seconds to 3 minutes, narrated, and its sharing permissions are tested in a private browser.
- [x] D2 is at most 500 words and D3 names the actual Bob tools and decisions shown in evidence.
- [ ] The team submits before the internal 12:00 SAST target and makes no post-deadline changes.

## Claims discipline

- Say **Bob-native multi-agent orchestration**, **parallel specialist execution**, **observable workflow**, and **evidence-backed unified report**.
- Describe the browser-to-Bob step as an **operator handoff** unless a supported Bob dispatch API is actually integrated and demonstrated.
- The dashboard persists the latest run pointer locally for reload recovery; do not describe this as server-side or production persistence.
- Do not claim automatic browser-triggered Bob execution, perfect defect recall, or calibrated confidence.
- Use only timings, finding counts, and tool calls supported by committed session evidence or the live recorded run.
