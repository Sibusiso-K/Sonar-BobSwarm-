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

### 1. Load the master system prompt
Read `orchestrator/system_prompt.md` to ground yourself in the orchestration protocol.

### 2. Decompose the task
Call the decomposition logic to identify sub-tasks and their agent mappings:

```js
// Node: orchestrator/decompose.js
const { decompose } = require('./orchestrator/decompose');
const subtasks = decompose(userRequest);
// Returns: [{ agent: 'debugger', task: '...', context: [...files] }, ...]
```

Or reason through decomposition manually using the keyword table in the system prompt.

### 3. Load agent personas
For each agent type identified, read the corresponding persona file:
- Debugger → `agents/debugger.md`
- Documenter → `agents/documenter.md`
- Refactorer → `agents/refactorer.md`
- Onboarding → `agents/onboarding.md`
- Data Lineage → `agents/data_lineage.md`

### 4. Dispatch subagents in parallel
Use `spawn_subagent` for each sub-task. Independent tasks go in the **same turn**.
Pass `fork_context: true` only when the subagent needs conversation history.

```
spawn_subagent(name="general", description="[DEBUGGER PERSONA]\n...\n\n[TASK]\n...")
spawn_subagent(name="general", description="[DOCUMENTER PERSONA]\n...\n\n[TASK]\n...")
```

### 5. Aggregate and report
Once all subagents return, merge findings into the Unified Report format
defined in `orchestrator/system_prompt.md`.

## Anti-patterns to avoid
- ❌ Running subagents sequentially when they are independent
- ❌ Dispatching a subagent without a clear, scoped task description
- ❌ Skipping the executive summary in the final report
- ❌ Reporting the same issue multiple times from different agents
