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

## Project structure

```
src/
  lib/            shared types + REST/WS client
  hooks/          useSwarmRun — orchestrates the whole run lifecycle
  components/
    layout/       Nav
    hero/         Hero, TaskForm
    field/        SwarmField (ambient background)
    swarm/        SwarmStage, RoleCard, Timeline
    report/       ReportView
  App.tsx         composes the full page: Nav → Hero → SwarmStage → ReportView
```

## Build

```bash
npm run build   # type-checks with tsc -b, then builds with vite
npm run preview # serve the production build locally
```
