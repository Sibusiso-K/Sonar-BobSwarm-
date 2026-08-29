---
name: bobswarm
description: >
  Activates the BobSwarm multi-agent orchestration protocol. Use whenever a user submits
  a complex engineering task that should be decomposed and dispatched to specialist
  subagents running in parallel. Triggers on: analyse codebase, debug and document,
  full engineering audit, onboard a developer, trace data lineage, swarm, BobSwarm.
---

# BobSwarm Orchestration Skill

## When to activate
Activate this skill when:
- The user describes a task that spans multiple engineering disciplines (debug + document, refactor + onboard, etc.)
- The user explicitly says "use BobSwarm" or "run a swarm"
- The task would benefit from parallel investigation rather than sequential steps

## Orchestration Steps

### 1. Establish the dashboard run

The dashboard creates the pending run and displays its UUID; it does not invoke Bob.
Require the user to include that exact UUID as `runId` in the Bob request. Never invent a
run ID and never treat `<RUN_ID_FROM_DASHBOARD>` as a real value. If no valid run ID is
present, ask the user to create the task in the dashboard and paste the displayed UUID
before dispatching any subagent.

The first successful subagent `record_progress(..., status: "started")` moves the existing
run into active execution. The orchestrator does not create runs or emit duplicate
subagent lifecycle events.

### 2. Load the master system prompt
Read `orchestrator/system_prompt.md` to ground yourself in the orchestration protocol.

### 3. Decompose the task
Call the decomposition logic to identify sub-tasks and their agent mappings:

```js
// Node: orchestrator/decompose.js
const { decompose, buildDispatchPayload } = require('./orchestrator/decompose');
const subtasks = decompose(userRequest, contextFiles, taskType);
// Returns: [{ agent: 'debugger', task: '...', context: [...files] }, ...]
```

When the dashboard supplies a supported `taskType`, pass it as the third
argument. It is authoritative: `full_audit` selects all five specialists and
an individual specialist type selects only that specialist. Only omit it when
there is no dashboard task type and keyword routing is intentionally desired.

Or reason through decomposition manually using the keyword table in the system prompt.

### 4. Load agent personas
For each agent type identified, read the corresponding persona file:
- Debugger → `agents/debugger.md`
- Documenter → `agents/documenter.md`
- Refactorer → `agents/refactorer.md`
- Onboarding → `agents/onboarding.md`
- Data Lineage → `agents/data_lineage.md`

### 5. Build complete dispatch payloads

Use `buildDispatchPayload` from `orchestrator/decompose.js` for every selected sub-task.
Provide the sub-task, exact dashboard `runId`, and the loaded persona text. This helper
adds the required MCP lifecycle and evidence instructions; never dispatch only a persona
and task description.

```js
const payload = buildDispatchPayload({
  subtask,
  runId,                  // exact UUID copied from the dashboard
  personaPrompt,
  dependencyContext,     // required when Refactorer depends on Debugger
});
```

Every resulting payload requires the specialist to:

1. Call `record_progress` with `started` before investigation.
2. Read source through `read_project_file`.
3. Call `record_progress` with `investigating` while working.
4. Call `record_finding` once per distinct observation, using literal quoted source
   evidence and only `breaks`, `warns`, or `informational` severity.
5. Call `record_progress` with `done` exactly once after recording findings.
6. Return to the orchestrator without calling `finalize_run`.

### 6. Dispatch with dependency awareness

Use `spawn_subagent` for each complete payload. Independent tasks go in the **same turn**.
Pass `fork_context: true` only when the subagent needs conversation history.

If Debugger and Refactorer are both selected, dispatch Debugger in the first parallel
batch and wait for it. Then build the Refactorer payload with the completed Debugger
result as `dependencyContext` and dispatch it. Refactorer may join the first batch only
when Debugger is not selected.

### 7. Finalize, aggregate, and report

After every subagent has returned and reported `done`, call `finalize_run` exactly once.
Use its deterministic `findingsByRole` result as the source of truth, deduplicate overlap,
and render the Unified Report format defined in `orchestrator/system_prompt.md`.

## Anti-patterns to avoid
- ❌ Running subagents sequentially when they are independent
- ❌ Dispatching a subagent without a clear, scoped task description
- ❌ Inventing a run ID or implying the dashboard directly invoked Bob
- ❌ Omitting the MCP lifecycle/evidence contract from a subagent payload
- ❌ Dispatching Refactorer concurrently with a selected Debugger
- ❌ Calling `finalize_run` before every specialist has reported `done`
- ❌ Skipping the executive summary in the final report
- ❌ Reporting the same issue multiple times from different agents
