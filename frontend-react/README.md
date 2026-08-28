# BobSwarm Frontend

A single-page React + Vite app that dispatches an engineering task to five
parallel specialist agents (debugger, documenter, refactorer, onboarding,
data-lineage) and streams their progress live via WebSocket into one
unified report.

## Stack
- React 19 + TypeScript, Vite 8
- Tailwind CSS v4 (CSS-based `@theme`, no config file needed)
- Framer Motion for animation, lucide-react for icons

## Run it

```bash
npm install
npm run dev
```

Open the printed local URL (usually http://localhost:5173).

## Backend contract

The app expects a backend at `http://localhost:8787` (override with a
`VITE_BOBSWARM_API` env var, e.g. in a `.env` file) exposing:

- `POST /runs` — body `{ taskDescription, taskType, repoRef }`, returns a `Run`
- `WS /runs/:id/events` — streams `SwarmEvent` JSON frames: `progress`,
  `finding`, and `run_complete` (see `src/lib/types.ts` for exact shapes)

If no backend is running, submitting the form shows a friendly
"can't reach the BobSwarm events server" message instead of crashing —
the UI itself has no other dependency on a live backend.

The WebSocket client (`src/lib/api.ts`) auto-reconnects on an unexpected
drop with capped exponential backoff (6 attempts, ~0.8s → ~25s + jitter),
surfacing a `reconnecting` connection state in the UI. It stops cleanly
once a `run_complete` event arrives or the caller unsubscribes.

## The living swarm field

`src/components/field/LivingSwarmField.tsx` is a canvas-based particle
system, not decoration. In the hero it drifts ambiently; once a run starts,
`SwarmStage` measures each specialist card's real on-screen position and
feeds those as "anchors" into the field. Particles then orbit each anchor,
with orbit speed, radius, and color driven directly by that role's live
status (waiting → started → investigating → done/error) — so the swarm
visibly gathers, tightens, and settles around whichever specialist is
actually working, rather than just sitting behind the UI.

## Project structure

```
src/
  lib/            shared types + REST/WS client (with reconnect logic)
  hooks/          useSwarmRun — orchestrates the whole run lifecycle
  components/
    layout/       Nav
    hero/         Hero, TaskForm (mouse-parallax depth + glass tilt)
    field/        LivingSwarmField (reactive particle centerpiece)
    swarm/        SwarmStage, RoleCard, Timeline
    report/       ReportView
  App.tsx         composes the full page: Nav → Hero → SwarmStage → ReportView
```

## Build

```bash
npm run build   # type-checks with tsc -b, then builds with vite
npm run preview # serve the production build locally
```
