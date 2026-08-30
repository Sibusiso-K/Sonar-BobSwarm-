import { access, readFile, readdir } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const members = ["sibusiso", "lethabo", "arisha", "mmopiemang", "farheen"];
let failures = 0;
let warnings = 0;

function pass(message) {
  console.log(`PASS  ${message}`);
}

function warn(message) {
  warnings += 1;
  console.warn(`WARN  ${message}`);
}

function fail(message) {
  failures += 1;
  console.error(`FAIL  ${message}`);
}

async function exists(filePath) {
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function fetchJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(3_000) });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

async function checkMcpConfig() {
  const configPath = path.join(root, ".bob", "mcp.json");
  if (!(await exists(configPath))) {
    fail(".bob/mcp.json is missing; copy .bob/mcp.json.example and set cwd.");
    return;
  }

  try {
    const config = JSON.parse(await readFile(configPath, "utf8"));
    const configuredCwd = config?.mcpServers?.bobswarm?.cwd;
    if (!configuredCwd) {
      fail(".bob/mcp.json has no mcpServers.bobswarm.cwd value.");
      return;
    }
    const expected = path.resolve(root).toLowerCase();
    const actual = path.resolve(configuredCwd).toLowerCase();
    if (actual !== expected) {
      fail(`Bob MCP cwd points to ${configuredCwd}, expected ${root}.`);
      return;
    }
    pass("Bob MCP registration points at this repository.");
  } catch (error) {
    fail(`.bob/mcp.json is invalid: ${error.message}`);
  }
}

async function checkServices() {
  try {
    const health = await fetchJson("http://127.0.0.1:8787/health");
    if (health.status === "ok" && health.service === "bobswarm-events") {
      pass("Events bridge is healthy on 127.0.0.1:8787.");
    } else {
      fail("Events bridge returned an unexpected health payload.");
    }
  } catch (error) {
    fail(`Events bridge is unavailable: ${error.message}`);
  }

  try {
    const response = await fetch("http://127.0.0.1:5173", {
      signal: AbortSignal.timeout(3_000),
    });
    const html = await response.text();
    if (response.ok && /BobSwarm/i.test(html)) {
      pass("Frontend is serving BobSwarm on 127.0.0.1:5173.");
    } else {
      fail("Port 5173 is responding, but it is not the BobSwarm frontend.");
    }
  } catch (error) {
    fail(`Frontend is unavailable: ${error.message}`);
  }
}

async function checkRunHistory() {
  try {
    const runs = await fetchJson("http://127.0.0.1:8787/runs");
    if (!Array.isArray(runs)) {
      fail("GET /runs did not return an array.");
      return;
    }
    if (runs.length === 0) {
      pass("Run history is empty and ready for a clean recording.");
      return;
    }

    const active = runs.filter((run) => run.status === "pending" || run.status === "running");
    const errors = runs.filter((run) => run.status === "error");
    if (active.length > 0) {
      warn(`${active.length} unfinished run(s) will appear in the dashboard history.`);
    }
    if (errors.length > 0) {
      warn(`${errors.length} failed run(s) will appear in the dashboard history.`);
    }
    if (active.length === 0 && errors.length === 0) {
      pass(`${runs.length} completed historical run(s) available for recovery.`);
    } else {
      warn("Reconnect/restart the BobSwarm MCP server before recording if you need a clean history.");
    }
  } catch (error) {
    fail(`Could not inspect run history: ${error.message}`);
  }
}

async function checkEvidence() {
  for (const member of members) {
    const memberDir = path.join(root, "bob_sessions", member);
    let files = [];
    try {
      files = await readdir(memberDir);
    } catch {
      warn(`${member}: root bob_sessions directory is missing.`);
      continue;
    }

    const hasConsumption = files.some((name) => /consumption.*\.(png|jpe?g)$/i.test(name));
    const hasHistory = files.some((name) => /task-history.*\.md$/i.test(name));
    if (hasConsumption && hasHistory) {
      pass(`${member}: consumption screenshot and exported task history are present.`);
    } else {
      const missing = [
        !hasConsumption ? "consumption screenshot" : null,
        !hasHistory ? "exported task history" : null,
      ].filter(Boolean).join(" and ");
      warn(`${member}: missing ${missing} under root bob_sessions/${member}/.`);
    }
  }
}

function checkGitState() {
  try {
    const status = execFileSync("git", ["status", "--porcelain"], {
      cwd: root,
      encoding: "utf8",
      windowsHide: true,
    }).trim();
    if (status) warn("Working tree is not clean; freeze and push before the final recording.");
    else pass("Working tree is clean.");
  } catch (error) {
    warn(`Could not inspect Git status: ${error.message}`);
  }
}

console.log("BobSwarm judge-demo preflight\n");
await checkMcpConfig();
await checkServices();
await checkRunHistory();
await checkEvidence();
checkGitState();

console.log(`\nResult: ${failures} failure(s), ${warnings} warning(s).`);
if (failures > 0) process.exitCode = 1;
