'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const store = require('../store');

const runInput = {
  taskDescription: 'Audit the checkout workflow',
  taskType: 'full_audit',
  repoRef: 'demo/sample-project',
};

const findingInput = {
  subagentRole: 'debugger',
  targetSymbol: 'checkout',
  affectedPath: 'src/checkout.js',
  severity: 'breaks',
  evidence: 'throw new Error("checkout failed")',
};

test.afterEach(() => store.__resetForTests());

test('report reads are side-effect-free and return partial deterministic state', () => {
  const run = store.createRun(runInput);
  const pendingReport = store.getReport(run.id);

  assert.equal(pendingReport.status, 'pending');
  assert.equal(pendingReport.isFinal, false);
  assert.equal(pendingReport.generatedAt, null);
  assert.equal(store.getRun(run.id).status, 'pending');

  store.recordFinding(run.id, findingInput);
  const runningReport = store.getReport(run.id);
  assert.equal(runningReport.status, 'running');
  assert.equal(runningReport.isFinal, false);
  assert.equal(runningReport.findingsByRole.debugger.length, 1);
  assert.equal(store.getRun(run.id).status, 'running');
});

test('lifecycle is one-way, finalization is idempotent, and terminal writes are rejected', () => {
  const run = store.createRun(runInput);
  assert.throws(
    () => store.finalizeRun(run.id),
    (error) => error.code === 'INVALID_TRANSITION' && error.statusCode === 409
  );

  store.recordProgress(run.id, 'debugger', 'started', 'Opening source files');
  store.recordFinding(run.id, findingInput);
  const firstReport = store.finalizeRun(run.id);
  const firstSnapshot = store.getSnapshot(run.id);
  const secondReport = store.finalizeRun(run.id);
  const secondSnapshot = store.getSnapshot(run.id);

  assert.equal(firstReport.status, 'complete');
  assert.equal(firstReport.isFinal, true);
  assert.equal(secondReport.generatedAt, firstReport.generatedAt);
  assert.deepEqual(secondReport, firstReport);
  assert.equal(firstSnapshot.events.filter((event) => event.type === 'run_complete').length, 1);
  assert.equal(secondSnapshot.events.filter((event) => event.type === 'run_complete').length, 1);

  assert.throws(
    () => store.recordProgress(run.id, 'debugger', 'done', 'late write'),
    (error) => error.code === 'RUN_TERMINAL' && error.statusCode === 409
  );
  assert.throws(
    () => store.recordFinding(run.id, findingInput),
    (error) => error.code === 'RUN_TERMINAL' && error.statusCode === 409
  );
});

test('snapshot cursors replay only missed, monotonically sequenced events', () => {
  const run = store.createRun(runInput);
  const first = store.recordProgress(run.id, 'debugger', 'started', 'Started');
  store.recordFinding(run.id, findingInput);

  const snapshot = store.getSnapshot(run.id, first.sequence);
  assert.equal(snapshot.type, 'snapshot');
  assert.equal(snapshot.afterSequence, first.sequence);
  assert.equal(snapshot.events.length, 1);
  assert.equal(snapshot.events[0].type, 'finding');
  assert.equal(snapshot.events[0].sequence, first.sequence + 1);
  assert.equal(snapshot.lastSequence, first.sequence + 1);
  assert.equal(snapshot.progressByRole.debugger.status, 'started');
  assert.equal(snapshot.report.findingsByRole.debugger.length, 1);

  assert.throws(
    () => store.getSnapshot(run.id, '1x'),
    (error) => error.code === 'INVALID_INPUT' && error.statusCode === 400
  );
});

test('pending runs time out into an explicit terminal error', async () => {
  const run = store.createRun(runInput);
  store.armTimeout(run.id, 15);
  await new Promise((resolve) => setTimeout(resolve, 40));

  const timedOut = store.getRun(run.id);
  const snapshot = store.getSnapshot(run.id);
  assert.equal(timedOut.status, 'error');
  assert.equal(timedOut.error.code, 'RUN_TIMEOUT');
  assert.equal(snapshot.report.isFinal, true);
  assert.equal(snapshot.events.at(-1).type, 'run_error');
  assert.equal(snapshot.events.at(-1).error.code, 'RUN_TIMEOUT');
});

test('public run objects are defensive copies', () => {
  const created = store.createRun(runInput);
  created.status = 'complete';
  const read = store.getRun(created.id);
  read.taskDescription = 'mutated';

  assert.equal(store.getRun(created.id).status, 'pending');
  assert.equal(store.getRun(created.id).taskDescription, runInput.taskDescription);
});
