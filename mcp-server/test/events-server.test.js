'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { WebSocket } = require('ws');
const store = require('../store');
const { MAX_BODY_BYTES, startEventsServer } = require('../events-server');

let server;
let baseUrl;

const validRun = {
  taskDescription: 'Review the demo repository',
  taskType: 'full_audit',
  repoRef: 'demo/sample-project',
};

test.before(async () => {
  server = startEventsServer({ host: '127.0.0.1', port: 0 });
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  store.__resetForTests();
  if (server.listening) {
    server.close();
    await once(server, 'close');
  }
});

test.afterEach(() => store.__resetForTests());

async function postRun(body, headers = { 'Content-Type': 'application/json' }) {
  return fetch(`${baseUrl}/runs`, {
    method: 'POST',
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

test('HTTP API validates media type, JSON, required values, and body size', async () => {
  const wrongMediaType = await postRun('{}', { 'Content-Type': 'text/plain' });
  assert.equal(wrongMediaType.status, 415);
  assert.equal((await wrongMediaType.json()).code, 'UNSUPPORTED_MEDIA_TYPE');

  const malformed = await postRun('{broken');
  assert.equal(malformed.status, 400);
  assert.equal((await malformed.json()).code, 'INVALID_JSON');

  const invalidTaskType = await postRun({ ...validRun, taskType: '../../anything' });
  assert.equal(invalidTaskType.status, 400);
  assert.equal((await invalidTaskType.json()).code, 'INVALID_INPUT');

  const extensibleTaskType = await postRun({ ...validRun, taskType: 'schema_impact' });
  assert.equal(extensibleTaskType.status, 201);

  const tooLarge = await postRun({ ...validRun, taskDescription: 'x'.repeat(MAX_BODY_BYTES) });
  assert.equal(tooLarge.status, 413);
  assert.equal((await tooLarge.json()).code, 'PAYLOAD_TOO_LARGE');
});

test('report reads stay partial and snapshot endpoint exposes stable recovery shape', async () => {
  const createResponse = await postRun(validRun);
  assert.equal(createResponse.status, 201);
  const run = await createResponse.json();

  const reportResponse = await fetch(`${baseUrl}/runs/${run.id}/report`);
  const report = await reportResponse.json();
  assert.equal(reportResponse.status, 200);
  assert.equal(report.status, 'pending');
  assert.equal(report.isFinal, false);
  assert.equal((await (await fetch(`${baseUrl}/runs/${run.id}`)).json()).status, 'pending');

  const snapshotResponse = await fetch(`${baseUrl}/runs/${run.id}/snapshot?after=0`);
  const snapshot = await snapshotResponse.json();
  assert.equal(snapshotResponse.status, 200);
  assert.equal(snapshot.type, 'snapshot');
  assert.equal(snapshot.run.id, run.id);
  assert.equal(snapshot.report.status, 'pending');
  assert.deepEqual(snapshot.events, []);
  assert.equal(snapshot.lastSequence, 0);
});

test('WebSocket reconnect receives snapshot replay then ordered live events', async () => {
  const run = await (await postRun(validRun)).json();
  const progress = store.recordProgress(run.id, 'debugger', 'started', 'Inspecting source');

  const socket = new WebSocket(
    `${baseUrl.replace('http', 'ws')}/runs/${run.id}/events?after=0`,
    { origin: 'http://localhost:5173' }
  );
  const [snapshotFrame] = await once(socket, 'message');
  const snapshot = JSON.parse(snapshotFrame.toString());
  assert.equal(snapshot.type, 'snapshot');
  assert.equal(snapshot.events.length, 1);
  assert.equal(snapshot.events[0].sequence, progress.sequence);
  assert.equal(snapshot.progressByRole.debugger.status, 'started');

  const liveFramePromise = once(socket, 'message');
  store.recordFinding(run.id, {
    subagentRole: 'debugger',
    targetSymbol: 'parseInput',
    affectedPath: 'src/input.js',
    severity: 'warns',
    evidence: 'return JSON.parse(input)',
  });
  const [liveFrame] = await liveFramePromise;
  const liveEvent = JSON.parse(liveFrame.toString());
  assert.equal(liveEvent.type, 'finding');
  assert.equal(liveEvent.sequence, progress.sequence + 1);

  const closePromise = once(socket, 'close');
  socket.close();
  await closePromise;

  const reconnected = new WebSocket(
    `${baseUrl.replace('http', 'ws')}/runs/${run.id}/events?after=${progress.sequence}`,
    { origin: 'http://localhost:5173' }
  );
  const [replayFrame] = await once(reconnected, 'message');
  const replay = JSON.parse(replayFrame.toString());
  assert.equal(replay.type, 'snapshot');
  assert.equal(replay.events.length, 1);
  assert.equal(replay.events[0].type, 'finding');
  assert.equal(replay.report.findingsByRole.debugger.length, 1);

  const reconnectClosePromise = once(reconnected, 'close');
  reconnected.close();
  await reconnectClosePromise;
});

test('unknown resources and disallowed browser origins receive accurate status codes', async () => {
  const missing = await fetch(`${baseUrl}/runs/not-a-run`);
  assert.equal(missing.status, 404);
  assert.equal((await missing.json()).code, 'RUN_NOT_FOUND');

  const forbidden = await fetch(`${baseUrl}/runs`, {
    headers: { Origin: 'https://malicious.example' },
  });
  assert.equal(forbidden.status, 403);
  assert.equal((await forbidden.json()).code, 'ORIGIN_NOT_ALLOWED');
});
