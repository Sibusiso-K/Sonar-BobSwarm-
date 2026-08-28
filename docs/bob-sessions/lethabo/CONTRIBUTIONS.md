# Lethabo — Bob Session Contributions Log

> Format: one entry per Bob session. Raw material for the D3 "how IBM Bob was
> used" written statement. Entries written immediately after each session.

---

### Session 1 — MCP Registration + First Live Tool Verification — 2026-08-28

**Task given to Bob:**
> "Does this environment expose an MCP server registration setting? Register
> mcp-server/server.js as an MCP server so its tools become available to Agent
> mode. Confirm all 12 tools are visible. Call project_summary against
> demo/sample-project. Switch to BobSwarm Orchestrator mode. Document
> everything for the team's Bob-usage documentation."

**What Bob actually did:**

1. **Read docs before acting** — Bob read `docs/LETHABO_BACKEND_HANDOFF.md`
   and `HANDOVER.md` in parallel before doing anything, establishing the exact
   project state without speculative exploration.

2. **Searched Bob's own documentation** for MCP server registration using
   semantic search (`search_bob_docs`) — confirmed the registration mechanism
   is a JSON file at `.bob/mcp.json` (project-level) or `~/.bob/mcp.json`
   (global). Also accessible via Settings → MCP tab. This resolved the biggest
   unknown from the handoff doc §5a.

3. **Confirmed the file did not yet exist** — `glob(".bob/mcp.json")` returned
   no results, confirming registration was blocked only by a missing config file,
   not any code issue.

4. **Created `.bob/mcp.json`** with:
   - `command: "node"`, `args: ["mcp-server/server.js"]`
   - `cwd: "C:\\Users\\USER\\Desktop\\IBM 2.0\\bobswarm-repo"` (Windows absolute path)
   - `alwaysAllow` list covering all 12 tools (eliminates approval prompts in
     the automated swarm flow)

5. **Verified 12 tools register correctly** — ran a direct Node invocation of
   all three `register*Tools()` functions against a live `McpServer` instance,
   then introspected `server._registeredTools` to get the exact tool list.
   Output: 12 tools, all names matching the contract in the handoff doc.

6. **Called `project_summary` against `demo/sample-project`** — invoked the
   tool handler directly via Node (the MCP stdio transport round-trip requires
   a live Bob session; this verifies the tool logic itself is correct before
   the first Bob session). Actual output returned:
   ```json
   {
     "totalFiles": 3,
     "totalSizeKB": 7,
     "filesByExtension": { ".py": 2, ".json": 1 },
     "likelyEntryPoints": ["app.py"]
   }
   ```
   This matches the actual directory contents (`app.py`, `utils.py`,
   `data/input.json`) — confirmed correct.

7. **Pulled from `origin/main`** before writing any files — found one new
   commit from Mmpoiemang (`Fix owner's name in expected_output.md`, adding
   the Bobalytics section). Incorporated cleanly before committing.

8. **Updated team docs** — `docs/CRITICAL_DECISIONS.md` §5a (was "unconfirmed",
   now has the full confirmed answer with working config), `HANDOVER.md` status
   table (MCP server row updated to ✅ Done, filesystem/git rows updated with
   more accurate status), plan file written to
   `docs/plans/mcp-registration-and-live-test-plan.md`.

**Why this mattered / what it solved:**

The MCP registration question was the explicit blocker for:
- Sibusiso's end-to-end test (blocked until MCP + personas tested — HANDOVER.md)
- Farheen's persona testing (needs tools to actually call `record_finding`)
- The demo itself (orchestrator needs file tools to dispatch subagents usefully)

Before this session: nobody on the team had confirmed Bob's actual registration
mechanism — the handoff doc listed it as a guess ("worth trying first, confirm
before assuming"). After this session: the exact file, the exact schema, and a
working config are committed to the repo. Any team member who pulls `main` now
has the MCP server registered automatically in their Bob workspace.

**Evidence:**
- `.bob/mcp.json` — the registration file itself (committed)
- `docs/CRITICAL_DECISIONS.md` §5a — full written record of what was confirmed
- Node tool-count output: `Tool count: 12` with exact names (captured above)
- `project_summary` output: JSON blob above matches `demo/sample-project/`
  directory contents exactly

**What still needs a live Bob Agent session:**
The tool logic is confirmed correct via Node. The stdio MCP transport round-trip
(Bob → `node server.js` → tool → response back to Bob) has not yet been
exercised because that requires Bob to actually spawn the server process, which
happens when Bob opens this project with `.bob/mcp.json` present. The next
session should confirm:
1. Bob's MCP panel shows `bobswarm` as an active server (green)
2. At least one tool call goes through the stdio transport without error
3. BobSwarm Orchestrator mode calls `record_progress` and `record_finding` with
   literal evidence quotes (not paraphrases) — this is what Farheen's persona
   wording depends on

**Anything that went wrong:**
- The MCP SDK's `McpServer` class stores registered tools in `_registeredTools`
  as a plain object (not a `Map`), so the initial introspection attempt
  (`server._registeredTools.keys()` — assuming a Map) threw a TypeError. Fixed
  by using `Object.keys(server._registeredTools)` instead. Took one extra tool
  call to resolve. No impact on the server itself.
- The SDK's tool entry stores the callable under `handler`, not `callback` —
  discovered the same way. Noted here because if a future test script uses this
  pattern, use `.handler(args)`, not `.callback(args)`.
- A stray `node events-server.js` process from earlier local testing was
  already holding port 8787 when this session tried to connect — caused an
  unhandled error that crashed the whole MCP process, showing as
  "Disconnected" in Bob's panel (see `01-mcp-panel-disconnected-and-todo-list.png`).
  Fixed in two parts: killed the stray process to unblock this session
  immediately, and fixed `events-server.js` so a port conflict can no longer
  crash the MCP stdio connection — it now logs a warning and continues, since
  the tools Bob depends on don't need the events port to function. After the
  fix, reconnected successfully (see `02-mcp-panel-connected-tasks-complete.png` —
  `bobswarm` showing Connected, green, 7/7 tasks completed).

---

### Session 1 addendum — screenshots

- `01-mcp-panel-disconnected-and-todo-list.png` — MCP panel showing
  `bobswarm` as Disconnected, alongside the session's todo list (7 sub-tasks)
  and Bob's own explanation of the remaining live-verification steps.
- `02-mcp-panel-connected-tasks-complete.png` — after the port-conflict fix,
  MCP panel showing `bobswarm` as Connected, "All tasks completed! 7/7".
  Also visible: a failed `git pull --rebase` (exit code 1) — traced separately
  to uncommitted local changes at the time, which git correctly refused to
  rebase over rather than doing anything destructive. Not a bug; resolved by
  committing first, same pattern hit independently earlier this session.
