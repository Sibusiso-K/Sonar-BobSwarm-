# BobSwarm MCP backend

This package exposes BobSwarm's Git, filesystem, progress, finding, and report
tools over MCP stdio. It also runs a loopback HTTP/WebSocket bridge for the
dashboard.

## Requirements and verification

- Node.js 20, 22, or newer (Node 21 is not supported by `glob` 11)
- Reproducible install: `npm ci`
- Backend tests: `npm test`
- Syntax and test gate: `npm run check`

The package lock is committed. Dependency updates should update both
`package.json` and `package-lock.json` in the same change.

## Run lifecycle

The only accepted state transitions are:

```text
pending -> running -> complete
   |          |
   v          v
 error      error
```

The first progress event or finding starts a pending run. A run must be
running before `finalize_run` can complete it. Completion is idempotent:
retrying `finalize_run` returns the original report without changing the
completion timestamp or emitting another event. Progress and findings are
rejected after either terminal state.

`get_run_report` and `GET /runs/:id/report` are always side-effect-free. For
active runs they return the current deterministic partial report with
`isFinal: false`.

Pending and running runs time out after five minutes of total elapsed time by
default and enter `error` with code `RUN_TIMEOUT`. Override this with
`BOBSWARM_RUN_TIMEOUT_MS`.

## Dashboard bridge

The default listener is `http://127.0.0.1:8787`:

- `GET /health`
- `POST /runs`
- `GET /runs`
- `GET /runs/:id`
- `GET /runs/:id/report`
- `GET /runs/:id/snapshot?after=<sequence>`
- WebSocket `/runs/:id/events?after=<sequence>`

Every progress, finding, completion, and error event has a monotonically
increasing `sequence`. The store keeps a bounded replay log and every
WebSocket connection receives this snapshot before live events:

```json
{
  "type": "snapshot",
  "runId": "uuid",
  "run": { "status": "running" },
  "report": { "status": "running", "isFinal": false, "findingsByRole": {} },
  "progressByRole": {},
  "events": [],
  "afterSequence": 0,
  "firstAvailableSequence": 1,
  "lastSequence": 0,
  "truncated": false,
  "at": "ISO-8601 timestamp"
}
```

Reconnect with the last applied sequence. `report` contains the authoritative
finding state and `progressByRole` contains the latest role states even when
old timeline events were condensed from the replay log.

The bridge accepts JSON request bodies up to 32 KiB. Browser origins default
to the Vite development/preview ports on `localhost` and `127.0.0.1`. Configure
additional exact origins with comma-separated `BOBSWARM_ALLOWED_ORIGINS`.
Configure the listener with `BOBSWARM_EVENTS_HOST` and
`BOBSWARM_EVENTS_PORT`.

## Filesystem boundary

All filesystem and Git paths are restricted to `BOBSWARM_ALLOWED_ROOT` (the
repository root by default). Validation resolves symlinks and Windows
junctions, including the nearest existing ancestor of new report paths, so a
lexically safe-looking link cannot escape the project boundary.
