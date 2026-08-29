# Contributing to BobSwarm

> **Hackathon ground rules + team workflow guide**

---

## Team Ownership Map

| Area | Owner | Key Files |
|---|---|---|
| Orchestrator / Bob config | **Sibusiso** | `orchestrator/system_prompt.md`, `.bob/custom_modes.yaml`, `.bob/skills/bobswarm/SKILL.md` |
| Backend / MCP Server | **Lethabo** | `mcp-server/` |
| Frontend / Dashboard | **Arisha** | `frontend/` |
| QA / Demo / Data | **Mmpoiemang** | `demo/` |
| Agent personas / Decomposition | **Farheen** | `agents/`, `orchestrator/decompose.js` |

**Rule:** Before touching another team member's files, ping them first.
For integration work, create a branch and open a PR.

---

## Branch Naming

```
feature/<your-name>/<short-description>
fix/<your-name>/<short-description>
```

Examples:
- `feature/lethabo/git-blame-tool`
- `fix/farheen/refactorer-dependency-logic`
- `feature/arisha/sse-realtime`

---

## Commit Message Format

```
<type>(<scope>): <short description>

[optional body]
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

Examples:
```
feat(mcp): add git_blame tool
fix(decompose): handle empty request string
docs(agents): improve debugger severity definitions
```

---

## Pull Request Checklist

Before opening a PR:
- [ ] My code is in my owned area (or I've discussed it with the owner)
- [ ] I have not broken any existing file structures
- [ ] If I added a new agent, I updated `decompose.js`, `frontend/src/components/swarm/RoleCard.tsx`, and `docs/architecture.md`
- [ ] If I changed the MCP server, I tested it locally with `node mcp-server/server.js`
- [ ] If I changed the demo, I ran `bash demo/run_demo.sh` and it executes cleanly

---

## Local Setup

### MCP Server (Lethabo)
```bash
cd mcp-server
npm install
node server.js     # test stdio connection
```

### Frontend (Arisha)
```bash
cd frontend
npm install
npm run dev      # http://localhost:5173, expects the backend at :8787
npm run build    # type-checks (tsc -b) then builds — run before any PR
```
Pulled in via `git subtree` from her own repo (github.com/Arisha004/frontend)
— see `docs/architecture.md`'s Frontend Dashboard section for how to pull her
future updates in.

### Demo (Mmpoiemang)
```bash
# Requires Python 3.10+
python demo/validate_demo.py
# Optional local-only edge-case fixture generation; no API calls are made:
python demo/generate_synthetic.py 5
# macOS/Linux/Git Bash:
bash demo/run_demo.sh
# Windows PowerShell:
powershell -ExecutionPolicy Bypass -File demo/run_demo.ps1
```

### Decomposition tests (Farheen)
```bash
node -e "
  const { decompose } = require('./orchestrator/decompose');
  console.log(JSON.stringify(decompose('find bugs and document the API', ['app.py']), null, 2));
"
```

---

## Integration Points

The orchestrator, agents, MCP server, and frontend connect at these seams:

```
Orchestrator
  ↓ reads persona from   agents/<type>.md
  ↓ calls MCP tool       list_project_files, read_project_file
  ↓ spawns               spawn_subagent(persona + task)
  ↓ writes report via    write_swarm_report

Frontend
  ← creates a pending run via POST /runs
  ← receives real MCP lifecycle events through HTTP/WebSocket
  ← reconnects with a sequenced snapshot/replay cursor
```

The dashboard-to-Bob boundary is deliberately explicit: the dashboard creates
the run and produces a copy-ready prompt; the operator pastes that prompt into
Bob's `BobSwarm Orchestrator` mode. Bob performs decomposition and
`spawn_subagent` dispatch. The dashboard never fabricates a swarm run.

If you're working on the MCP server or frontend, coordinate with Sibusiso on the
integration interface before changing tool names or event schemas.

