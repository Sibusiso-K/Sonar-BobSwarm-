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
- [ ] If I added a new agent, I updated `decompose.js`, `frontend/index.html`, and `docs/architecture.md`
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
# No build step needed — open directly in browser
open frontend/index.html
```

### Demo (Mmpoiemang)
```bash
# Requires Python 3.10+
pip install requests
bash demo/run_demo.sh
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
  ← polls/streams from   orchestrator status endpoint (future)
  ← currently simulates  swarm lifecycle locally
```

If you're working on the MCP server or frontend, coordinate with Sibusiso on the
integration interface before changing tool names or event schemas.

