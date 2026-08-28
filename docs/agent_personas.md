# BobSwarm — Agent Personas Reference

> **Owner:** Farheen (AI/ML Engineer)
> Consolidated reference for all BobSwarm specialist agent personas.

---

## Design Principles

1. **Narrow scope** — Each agent does exactly one job. No overlap.
2. **Clear deliverable** — Every persona specifies a concrete, reportable output format.
3. **Anti-patterns section** — Explicitly lists what each agent must NOT do.
4. **Self-contained** — The persona file alone is sufficient context to dispatch the agent.

---

## Agent Summary

| Agent | File | Trigger Keywords | Output |
|---|---|---|---|
| Debugger | `agents/debugger.md` | bug, error, crash, exception, fail, fix | Numbered issue list with severity, location, root cause, diff |
| Documenter | `agents/documenter.md` | document, docs, API, comment, explain | Inline comments + API reference + module overviews |
| Refactorer | `agents/refactorer.md` | refactor, clean, improve, optimise | Diff-style improvement list with rationale |
| Onboarding | `agents/onboarding.md` | onboard, guide, new developer, walkthrough | Structured getting-started document |
| Data Lineage | `agents/data_lineage.md` | data flow, lineage, trace, pipeline | Lineage map (sources → transforms → sinks) + quality risks |

---

## Dependency Graph

```
┌───────────┐   ┌──────────────┐   ┌────────────┐   ┌─────────────┐
│  Debugger │   │  Documenter  │   │ Onboarding │   │ Data Lineage│
│           │   │              │   │            │   │             │
│ parallel  │   │  parallel    │   │  parallel  │   │  parallel   │
└─────┬─────┘   └──────────────┘   └────────────┘   └─────────────┘
      │
      │ findings passed as context
      ▼
┌─────────────┐
│  Refactorer │  ← sequential (depends on Debugger)
└─────────────┘
```

---

## Prompt Injection Template

When dispatching a subagent, use this template:

```
[PERSONA]
<contents of agents/<type>.md>

[TASK]
<specific sub-task description from decompose.js>

[CONTEXT FILES]
<list of file paths the agent should read first>

[ADDITIONAL CONTEXT]
<any findings from previous agents, if applicable>
```

---

## Extending the Persona Set

To add a new specialist agent:

1. Create `agents/<new_type>.md` following the existing structure:
   - Persona identity + single-responsibility statement
   - Investigation/work protocol (numbered steps)
   - Output format (markdown template)
   - Anti-patterns (explicit don'ts)

2. Add to `KEYWORD_MAP` in `orchestrator/decompose.js`:
   ```js
   {
     agent: 'new_type',
     keywords: ['keyword1', 'keyword2'],
   }
   ```

3. Add the dependency rule (if any) to the `parallelAgents` / sequential block in `decompose.js`.

4. Add an agent card to `frontend/index.html`.

5. Update this reference document.
