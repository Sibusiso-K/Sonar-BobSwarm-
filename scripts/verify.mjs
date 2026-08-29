import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// `spawnSync("npm.cmd")` is not portable across Windows process hosts, even
// though invoking npm from a shell succeeds. npm exposes the CLI module it
// used to start this script, so running it through the current Node binary
// avoids the batch-file launcher entirely.
const npm = process.env.npm_execpath
  ? { command: process.execPath, prefix: [process.env.npm_execpath] }
  : { command: process.platform === "win32" ? "npm.cmd" : "npm", prefix: [] };

function run(label, command, args) {
  process.stdout.write(`\n==> ${label}\n`);
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    stdio: "inherit",
  });

  if (result.error) {
    throw new Error(`${label} could not start: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status}`);
  }
}

function findPython() {
  const configured = process.env.BOBSWARM_PYTHON || process.env.PYTHON;
  const candidates = [
    ...(configured ? [[configured, []]] : []),
    ["python3", []],
    ["python", []],
    ...(process.platform === "win32" ? [["py", ["-3"]]] : []),
  ];

  for (const [command, prefix] of candidates) {
    const probe = spawnSync(command, [...prefix, "--version"], {
      cwd: root,
      encoding: "utf8",
      windowsHide: true,
    });
    if (!probe.error && probe.status === 0) return { command, prefix };
  }

  throw new Error(
    "Python 3 was not found. Install Python 3 or set BOBSWARM_PYTHON to its executable path."
  );
}

try {
  const python = findPython();

  run("Orchestrator routing and dependency tests", process.execPath, [
    "--test",
    "orchestrator/_test_decompose.js",
  ]);
  run("Demo fixture validation", python.command, [
    ...python.prefix,
    "demo/validate_demo.py",
  ]);
  run("Demo Python regression tests", python.command, [
    ...python.prefix,
    "-m",
    "unittest",
    "discover",
    "-s",
    "demo/sample-project",
    "-p",
    "test_*.py",
  ]);
  run("Backend tests", npm.command, [...npm.prefix, "--prefix", "mcp-server", "test"]);
  run("Frontend lint", npm.command, [...npm.prefix, "--prefix", "frontend", "run", "lint"]);
  run("Frontend tests", npm.command, [...npm.prefix, "--prefix", "frontend", "run", "test", "--if-present"]);
  run("Frontend production build", npm.command, [...npm.prefix, "--prefix", "frontend", "run", "build"]);

  process.stdout.write("\nBobSwarm verification passed.\n");
} catch (error) {
  process.stderr.write(`\nBobSwarm verification failed: ${error.message}\n`);
  process.exitCode = 1;
}
