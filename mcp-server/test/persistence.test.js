'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function runStoreScript(script, persistPath) {
  return spawnSync(process.execPath, ['-e', script], {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
    env: { ...process.env, BOBSWARM_PERSIST_PATH: persistPath },
  });
}

test('opt-in persistence survives a process restart', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'bobswarm-persist-'));
  const persistPath = path.join(directory, 'runs.json');
  try {
    const writer = runStoreScript(`
      const store = require('./store');
      const run = store.createRun({
        taskDescription: 'Persist this run',
        taskType: 'full_audit',
        repoRef: 'demo/sample-project'
      });
      store.recordProgress(run.id, 'debugger', 'started', 'Started');
      setTimeout(() => console.log(run.id), 350);
    `, persistPath);
    assert.equal(writer.status, 0, writer.stderr);
    const runId = writer.stdout.trim();
    assert.ok(runId);

    const reader = runStoreScript(`
      const store = require('./store');
      if (!store.loadPersistedStateFromDisk()) process.exit(2);
      const run = store.listRuns()[0];
      console.log(JSON.stringify({ id: run.id, status: run.status }));
    `, persistPath);
    assert.equal(reader.status, 0, reader.stderr);
    assert.deepEqual(JSON.parse(reader.stdout), { id: runId, status: 'running' });
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('structurally invalid persisted JSON is rejected without crashing', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'bobswarm-persist-'));
  const persistPath = path.join(directory, 'runs.json');
  try {
    fs.writeFileSync(persistPath, JSON.stringify({ version: 1, runs: {} }));
    const result = runStoreScript(`
      const store = require('./store');
      console.log(store.loadPersistedStateFromDisk());
      console.log(store.listRuns().length);
    `, persistPath);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim(), 'false\n0');
    assert.match(result.stderr, /persisted state is invalid/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
