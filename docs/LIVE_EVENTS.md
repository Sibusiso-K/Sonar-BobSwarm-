# Live Events Integration — for Arisha (frontend)

> **Author:** Lethabo (Backend Engineer)

`frontend/app.js` currently uses `simulateSwarm()` with fake timers — this is
called out in `docs/CONTRIBUTING.md` as a known placeholder for a future real
feed. That feed now exists: `mcp-server/events-server.js`, running alongside the
MCP stdio server on port 8787 (override with `BOBSWARM_EVENTS_PORT`).

I haven't touched `frontend/` — that's your owned area per `CONTRIBUTING.md`.
This is the contract to wire against whenever you're ready to swap the
simulation for the real thing; ping me if anything here doesn't match what you
need.

## Starting a run

```
POST http://localhost:8787/runs
Content-Type: application/json

{ "taskDescription": "...", "taskType": "schema_impact", "repoRef": "/path/or/url" }
```

Returns the created run: `{ id, taskDescription, taskType, repoRef, status, createdAt, completedAt }`.

## Live events

```
new WebSocket(`ws://localhost:8787/runs/${runId}/events`)
```

Three message types arrive as JSON:

```jsonc
// subagent status change — drives the per-agent card state
{ "type": "progress", "runId": "...", "subagentRole": "debugger", "status": "started" | "investigating" | "done", "detail": "optional string", "at": "ISO timestamp" }

// one structured finding — append to the results panel as it arrives, don't wait for run_complete
{ "type": "finding", "runId": "...", "finding": {
    "id": "...", "subagentRole": "debugger", "targetSymbol": "...",
    "affectedPath": "...", "severity": "breaks" | "warns" | "informational",
    "evidence": "literal quoted source text", "createdAt": "ISO timestamp"
  }, "at": "ISO timestamp" }

// run finished — findings are already grouped by role and deterministically sorted, don't re-sort client-side
{ "type": "run_complete", "runId": "...", "report": { "runId": "...", "generatedAt": "...", "summary": "3 findings across 2 specialists — 1 breaks, 1 warns, 1 informational", "findingsByRole": { "debugger": [...], "...": [...] } }, "at": "ISO timestamp" }
```

## Reading a report without subscribing

```
GET http://localhost:8787/runs/:id/report
```

Same shape as the `run_complete` event's `report` field. Safe to call even if
the run is still in progress — it will contain whatever findings exist so far
and will force-finalize (mark the run complete) as a side effect, so only call
it when you actually want to end the run's live phase.

## Suggested mapping onto the existing UI

- Agent cards (per `docs/agent_personas.md`'s 5 agents) → update on `progress`
  events keyed by `subagentRole`.
- Results panel → append on `finding` events, grouped by `subagentRole`,
  colour-coded by `severity` (`breaks` = red, `warns` = amber, `informational`
  = neutral) — this is the "oh god yes" moment the working notes call for.
- Timeline → any of the three event types, timestamped by `at`.

CORS is wide open (`*`) on the events server for local dev — fine for the demo,
flag if it needs tightening before the video recording.
