# Live Events and Recovery Contract

The BobSwarm backend exposes two transports from the same process:

- MCP stdio for Bob's Git, filesystem, lifecycle, and finding tools.
- A loopback HTTP/WebSocket bridge for the React dashboard.

The bridge listens on `http://127.0.0.1:8787` by default. Configure the host,
port, and exact browser origins with `BOBSWARM_EVENTS_HOST`,
`BOBSWARM_EVENTS_PORT`, and `BOBSWARM_ALLOWED_ORIGINS`.

## Product boundary

`POST /runs` creates an observable pending run; it does not invoke IBM Bob. The
dashboard turns the created run into a copy-ready Bob handoff prompt. Bob then
uses that existing UUID for every MCP lifecycle call. The first progress event
or finding moves the run from `pending` to `running`.

## HTTP endpoints

| Endpoint | Purpose |
|---|---|
| `GET /health` | Liveness check |
| `POST /runs` | Create a validated pending run |
| `GET /runs` | List runs, newest first |
| `GET /runs/:id` | Read one run |
| `GET /runs/:id/report` | Read the current or final report without changing lifecycle state |
| `GET /runs/:id/snapshot?after=N` | Recover authoritative state and sequenced events after `N` |

Create-run body:

```json
{
  "taskDescription": "Audit the sample project",
  "taskType": "full_audit",
  "repoRef": "demo/sample-project"
}
```

`taskType` must be a lowercase identifier (letters, numbers, underscores,
starting with a letter). The dashboard only offers `full_audit`, `debugger`,
`documenter`, `refactorer`, `onboarding`, or `data_lineage`, and `decompose()`
only recognizes those six — an unrecognized `taskType` falls back to keyword
routing. The store itself does not reject other well-formed values; this is
deliberate forward-compatibility for new specialist types, not a validation
gap (see `mcp-server/test/events-server.test.js`). JSON bodies are limited to
32 KiB.

## Strict lifecycle

```text
pending -> running -> complete
   |          |
   v          v
 error      error
```

- The first progress event or finding starts the run.
- `finalize_run` requires a running run and is idempotent after completion.
- Progress and findings are rejected after `complete` or `error`.
- `get_run_report` and the report HTTP endpoint never finalize a run.
- Pending and running runs enter `error` after the configured timeout.

## WebSocket and replay

Connect with the last event sequence applied by the client:

```js
new WebSocket(`ws://127.0.0.1:8787/runs/${runId}/events?after=${lastSequence}`)
```

Every connection receives a `snapshot` frame before new live events. It
contains the current run, partial/final report, latest progress per role,
sequenced replay events, and a `truncated` flag. The report and
`progressByRole` remain authoritative even when the bounded timeline log has
condensed older events.

```jsonc
{
  "type": "snapshot",
  "runId": "...",
  "run": { "status": "running" },
  "report": { "status": "running", "isFinal": false, "findingsByRole": {} },
  "progressByRole": { "debugger": { "status": "investigating" } },
  "events": [],
  "afterSequence": 4,
  "firstAvailableSequence": 1,
  "lastSequence": 7,
  "truncated": false,
  "at": "ISO timestamp"
}
```

Live event types are:

```jsonc
{ "type": "progress", "sequence": 1, "runId": "...", "subagentRole": "debugger", "status": "started", "detail": null, "at": "ISO timestamp" }

{ "type": "finding", "sequence": 2, "runId": "...", "finding": {
    "id": "...", "subagentRole": "debugger", "targetSymbol": "...",
    "affectedPath": "...", "severity": "breaks" | "warns" | "informational",
    "evidence": "literal quoted source text", "createdAt": "ISO timestamp"
  }, "at": "ISO timestamp" }

{ "type": "run_complete", "sequence": 3, "runId": "...", "report": {
    "status": "complete", "isFinal": true, "summary": "...", "findingsByRole": {}
  }, "at": "ISO timestamp" }

{ "type": "run_error", "sequence": 3, "runId": "...", "error": {
    "code": "RUN_TIMEOUT", "message": "..."
  }, "report": { "status": "error", "isFinal": true }, "at": "ISO timestamp" }
```

## Local security defaults

- The server binds to loopback, not every network interface.
- Browser origins are allow-listed for Vite development/preview ports.
- Responses disable caching and content sniffing.
- WebSocket message compression is disabled and payload size is bounded.
- Filesystem and Git tools resolve real paths so symlinks and Windows
  junctions cannot escape `BOBSWARM_ALLOWED_ROOT`.

See [`mcp-server/README.md`](../mcp-server/README.md) for verification commands
and the full backend contract.
