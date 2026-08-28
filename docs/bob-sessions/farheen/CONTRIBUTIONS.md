# Contribution Log — Farheen (AI/ML Engineer)

> One entry per Bob session. Raw material for the D3 "how IBM Bob was used" written statement.

---

### Session 1 — Persona Verification, Keyword Refinement & Confidence Scoring — 2026-08-29, SAST

**Task given to Bob:**
> "Access the handover readme and go through the readme too to understand the work and also in the handover for now check Farheen portion of to do since that you have to complete that work — understand in which files you have to change and DONT CHANGE WHAT IS NOT MENTIONED IN THE 'FARHEEN' PORTION TO DO AND DONT CHANGE THE EXISTING CODE"

**What Bob actually did:**

1. **Read all context files in parallel** — `HANDOVER.md`, `README.md`, `orchestrator/decompose.js`, all 5 agent persona files (`agents/debugger.md`, `agents/documenter.md`, `agents/refactorer.md`, `agents/onboarding.md`, `agents/data_lineage.md`), and `docs/agent_personas.md` before touching any file.

2. **Ran decompose.js against 14 varied requests** via `execute_command` to identify keyword coverage gaps. Discovered that `"security audit"`, `"explain the architecture"`, and `"how does the data transformation work"` all fell through to the full-audit fallback instead of routing to the correct specific agents.

3. **Expanded `KEYWORD_MAP` in `orchestrator/decompose.js`** — added targeted keywords to 5 agent entries based on test results:
   - Debugger: `security`, `vulnerability`, `test fail`, `not working`, `wrong output`
   - Documenter: `architecture`, `api reference`, `how does`, `describe`, `summarise`
   - Refactorer: `performance`, `simplify`, `restructure`, `technical debt`, `code quality`
   - Onboarding: `new dev`, `new engineer`, `first contribution`, `setup guide`, `how to start`
   - Data Lineage: `data source`, `data origin`, `data path`, `data transformation`, `etl`, `ingestion`, `data map`

4. **Added `computeConfidence()` function** (stretch goal) — scores each sub-task 0.0–1.0 based on how many of the agent's keywords matched the request, normalised by the total keyword count. Every `SubTask` object now carries a `confidence` field. Full-audit fallback gets `0.5`. Function is exported alongside `decompose`.

5. **Verified the Refactorer dependency rule** via two live assertions:
   - `"fix bugs and refactor the code"` → `refactorer.parallel=false`, `dependsOn=['debugger']` ✅
   - `"refactor the code"` alone → `refactorer.parallel=true`, `dependsOn=[]` ✅

6. **Cross-checked all 5 persona output formats** against `orchestrator/system_prompt.md` — confirmed every persona's report heading emoji and title aligns with the Unified Report's aggregation sections (`### 🐛 Debugger`, `### 📝 Documenter`, etc.).

7. **Ran full agent testing** — three rounds of checks using `node` piped commands (no scripts left in the project):
   - Required sections check: 43 checks across 5 personas — ALL PASS
   - Anti-patterns check: 17 explicit don'ts verified across 5 personas — ALL PASS
   - End-to-end prompt assembly: full `[PERSONA]` + `[TASK]` + `[CONTEXT FILES]` + `[CONFIDENCE]` prompt built per agent against the demo task — ALL PASS (prompts 2275–2914 chars each)

8. **Updated `HANDOVER.md`** — status table row for Task Decomposition changed from `🟡 Template ready` to `✅ Done`; all 5 Farheen todo items marked `[x]` with evidence notes.

**Why this mattered / what it solved:**

Before this session, `decompose.js` missed common real-world phrasings: a request like `"security audit the application"` triggered a full-audit fallback (all 5 agents) instead of routing only to Debugger. After the keyword refinement, all 14 test requests route to the correct agent(s) with no false fallbacks.

The confidence score adds information the orchestrator can use: a sub-task with `confidence=0.07` (one keyword matched out of 15) is a weaker signal than `confidence=0.27` (3 keywords matched). This was listed as a stretch goal in the handover and is now shipped.

The persona format verification confirmed there is no mismatch between what agents output and what the orchestrator's Unified Report aggregation expects — both sides use the same emoji + heading structure, so the aggregation step will work without manual correction.

**Evidence:**
- Screenshots:
  - `01-task-prompt-todo-identified.png` — Before start: task prompt given to Bob + all 5 Farheen TODO items identified from HANDOVER.md (items 1–4 ticked, stretch goal pending)
  - `02-keyword-refinement-decompose-js.png` — Key decision point: Bob applying targeted diff to `decompose.js` — KEYWORD_MAP expanded, confidence score added
  - `03-14-test-gaps-and-error.png` — Failure captured: failed `node -e` command (PowerShell quote stripping) + 14-test gap analysis showing which requests misfired
  - `04-persona-findings-verified.png` — Farheen-specific: all 5 persona findings verified with structured evidence — full verification table showing every todo item ✅ Done with literal evidence references (the extract-don't-infer rule working correctly)
  - `05-agent-testing-complete-results.png` — At completion: Agent Testing Complete Results — all 7 checks ✅, "Everything passes. No scripts left in the project."

**Anything that went wrong:**

- First attempt to verify persona content used overly strict forbidden-word checks — the words `"refactor"` and `"document"` appeared in the Debugger's anti-patterns section (`"Do not refactor"`, `"Do not document"`), which caused false FAIL results. Corrected the check logic to verify required content only, which gave the correct ALL PASS result. No change was needed to the persona files themselves.
- PowerShell's `-e` flag strips double-quote characters from inline `node -e` strings, causing `SyntaxError: Invalid or unexpected token`. Resolved by piping the script via `$code | node` instead.
