/**
 * Executable decomposition tests.
 *
 * Run either command; a failed assertion exits non-zero:
 *   node orchestrator/_test_decompose.js
 *   node --test orchestrator/_test_decompose.js
 */
'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
  AGENT_TYPES,
  TASK_TYPES,
  buildDispatchPayload,
  computeConfidence,
  decompose,
  matchesKeyword,
  effortFromConfidence,
  buildRationale,
} = require('./decompose');

const A = AGENT_TYPES;

const routingCases = [
  ['find all the bugs and document the API', [A.DEBUGGER, A.DOCUMENTER]],
  ['refactor the legacy code', [A.REFACTORER]],
  ['onboard a new developer to this project', [A.ONBOARDING]],
  ['trace the data flow through the pipeline', [A.DATA_LINEAGE]],
  ['the app is crashing on startup', [A.DEBUGGER]],
  ['clean up and improve the codebase', [A.REFACTORER]],
  ['write getting started guide for new devs', [A.ONBOARDING]],
  ['what is the origin of this data', [A.DATA_LINEAGE]],
  ['fix exceptions and optimise performance', [A.DEBUGGER, A.REFACTORER]],
  [
    'analyse the codebase. Find all bugs, document the public API, suggest refactoring, trace the data flow, and write an onboarding guide.',
    [A.DEBUGGER, A.DOCUMENTER, A.ONBOARDING, A.DATA_LINEAGE, A.REFACTORER],
  ],
  ['review the code', [A.DEBUGGER, A.DOCUMENTER, A.ONBOARDING, A.DATA_LINEAGE, A.REFACTORER]],
  ['security audit the application', [A.DEBUGGER]],
  ['explain the architecture', [A.DOCUMENTER]],
  ['how does the data transformation work', [A.DOCUMENTER, A.DATA_LINEAGE]],
];

for (const [request, expectedAgents] of routingCases) {
  test(`routes: ${request}`, () => {
    const originalWarn = console.warn;
    console.warn = () => {};
    try {
      const result = decompose(request, ['demo/sample-project/app.py']);
      assert.deepEqual(result.map(({ agent }) => agent), expectedAgents);
      for (const subtask of result) {
        assert.ok(subtask.confidence > 0 && subtask.confidence <= 1);
      }
    } finally {
      console.warn = originalWarn;
    }
  });
}

test('refactorer waits for debugger when both are selected', () => {
  const result = decompose('fix bugs and refactor the code');
  const debuggerTask = result.find(({ agent }) => agent === A.DEBUGGER);
  const refactorerTask = result.find(({ agent }) => agent === A.REFACTORER);

  assert.ok(debuggerTask);
  assert.ok(refactorerTask);
  assert.equal(refactorerTask.parallel, false);
  assert.deepEqual(refactorerTask.dependsOn, [A.DEBUGGER]);
});

test('standalone refactorer has no artificial dependency', () => {
  const [refactorerTask] = decompose('refactor the code');
  assert.equal(refactorerTask.agent, A.REFACTORER);
  assert.equal(refactorerTask.parallel, true);
  assert.deepEqual(refactorerTask.dependsOn, []);
});

test('explicit task type is authoritative over request keywords', () => {
  const result = decompose('find bugs, document the API, and trace the data flow', [], TASK_TYPES.DOCUMENTER);
  assert.deepEqual(result.map(({ agent }) => agent), [A.DOCUMENTER]);
  assert.equal(result[0].confidence, 1);
  assert.equal(result[0].lowConfidenceWarning, false);
});

test('full audit task type selects all agents with the refactor dependency', () => {
  const result = decompose('write only onboarding notes', [], TASK_TYPES.FULL_AUDIT);
  assert.deepEqual(result.map(({ agent }) => agent), [
    A.DEBUGGER,
    A.DOCUMENTER,
    A.ONBOARDING,
    A.DATA_LINEAGE,
    A.REFACTORER,
  ]);
  assert.ok(result.slice(0, 4).every((task) => task.parallel));
  assert.equal(result[4].parallel, false);
  assert.deepEqual(result[4].dependsOn, [A.DEBUGGER]);
});

test('rejects unsupported explicit task types', () => {
  assert.throws(
    () => decompose('review the code', [], 'schema_impact'),
    /taskType must be full_audit or a supported specialist type/,
  );
});

test('marks an unclassified fallback as low confidence', () => {
  const result = decompose('please inspect this repository');
  assert.ok(result.every((task) => task.confidence === 0.5));
  assert.ok(result.every((task) => task.lowConfidenceWarning));
});

test('rejects invalid decomposition inputs', () => {
  assert.throws(() => decompose(''), /non-empty string/);
  assert.throws(() => decompose(null), /non-empty string/);
  assert.throws(() => decompose('find bugs', 'app.py'), /array of file paths/);
  assert.throws(() => decompose('find bugs', [42]), /array of file paths/);
});

test('copies context arrays so one subtask cannot mutate another', () => {
  const sourceContext = ['demo/sample-project/app.py'];
  const result = decompose('find bugs and document the API', sourceContext);

  result[0].context.push('unexpected.py');
  assert.deepEqual(sourceContext, ['demo/sample-project/app.py']);
  assert.deepEqual(result[1].context, ['demo/sample-project/app.py']);
});

test('confidence measures match strength, not synonym-list length', () => {
  assert.equal(computeConfidence('bug', ['bug']), 0.6);
  assert.equal(computeConfidence('bug', ['bug', 'error', 'crash', 'failure', 'issue']), 0.6);
  assert.equal(computeConfidence('bug crash error', ['bug', 'error', 'crash']), 0.9);
  assert.equal(computeConfidence('bug crash error failure issue', ['bug', 'error', 'crash', 'failure', 'issue']), 1);
  assert.equal(computeConfidence('documentation only', ['bug', 'error']), 0);
});

test('keyword matching respects token boundaries and common inflections', () => {
  assert.equal(matchesKeyword('find the bugs', 'bug'), true);
  assert.equal(matchesKeyword('the service is crashing', 'crash'), true);
  assert.equal(matchesKeyword('tests are failing', 'fail'), true);
  assert.equal(matchesKeyword('inspect the tissue sample', 'issue'), false);
  assert.equal(matchesKeyword('profile without errors', 'file'), false);
});

test('dispatch payload contains the exact run, role, lifecycle, and evidence contract', () => {
  const runId = '123e4567-e89b-42d3-a456-426614174000';
  const [subtask] = decompose('find bugs', ['demo/sample-project/app.py']);
  const payload = buildDispatchPayload({
    subtask,
    runId,
    personaPrompt: '# Debugger persona',
  });

  assert.match(payload, new RegExp(runId));
  assert.match(payload, /subagentRole exactly as provided: debugger/);
  assert.match(payload, /record_progress[\s\S]+status="started"/);
  assert.match(payload, /read_project_file/);
  assert.match(payload, /record_finding once per distinct/);
  assert.match(payload, /literal quoted span/);
  assert.match(payload, /severity must be exactly breaks, warns, or informational/);
  assert.match(payload, /status="done" exactly once/);
  assert.match(payload, /do not call finalize_run/);
});

test('dispatch payload never accepts an invented or malformed run ID', () => {
  const [subtask] = decompose('find bugs');
  assert.throws(
    () => buildDispatchPayload({ subtask, runId: 'run-123', personaPrompt: 'debugger' }),
    /existing UUID copied from the BobSwarm dashboard/,
  );
});

test('dependent refactorer cannot dispatch before debugger context exists', () => {
  const runId = '123e4567-e89b-42d3-a456-426614174000';
  const refactorerTask = decompose('fix bugs and refactor the code')
    .find(({ agent }) => agent === A.REFACTORER);

  assert.throws(
    () => buildDispatchPayload({ subtask: refactorerTask, runId, personaPrompt: 'refactorer' }),
    /requires completed debugger findings/,
  );

  const payload = buildDispatchPayload({
    subtask: refactorerTask,
    runId,
    personaPrompt: 'refactorer',
    dependencyContext: 'Debugger found a None-propagation failure in app.py.',
  });
  assert.match(payload, /DEPENDENCY CONTEXT — DEBUGGER COMPLETED/);
  assert.match(payload, /None-propagation failure/);
});

// ── effort / rationale — additive fields, existing behavior above is untouched ──

test('effortFromConfidence maps the fixed confidence values this system actually produces', () => {
  assert.equal(effortFromConfidence(1), 'deep');
  assert.equal(effortFromConfidence(0.9), 'deep');
  assert.equal(effortFromConfidence(0.75), 'standard');
  assert.equal(effortFromConfidence(0.6), 'standard');
  assert.equal(effortFromConfidence(0.5), 'light');
  assert.equal(effortFromConfidence(0), 'light');
});

test('buildRationale explains full_audit, explicit taskType, keyword match, and fallback distinctly', () => {
  assert.match(buildRationale(A.DEBUGGER, TASK_TYPES.FULL_AUDIT), /Full audit/);
  assert.match(buildRationale(A.DOCUMENTER, TASK_TYPES.DOCUMENTER), /Explicit dashboard task type: documenter/);
  assert.match(buildRationale(A.DEBUGGER, undefined, ['bug', 'crash']), /Matched keywords: bug, crash/);
  assert.match(buildRationale(A.DEBUGGER, undefined, []), /full-audit fallback/);
  assert.match(buildRationale(A.DEBUGGER, undefined, undefined), /full-audit fallback/);
});

test('every subtask carries a well-formed effort and rationale, without changing agent routing', () => {
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    for (const [request, expectedAgents] of routingCases) {
      const result = decompose(request, ['demo/sample-project/app.py']);
      assert.deepEqual(result.map(({ agent }) => agent), expectedAgents, `routing unchanged for: ${request}`);
      for (const subtask of result) {
        assert.ok(['light', 'standard', 'deep'].includes(subtask.effort), `${request} -> ${subtask.agent} effort`);
        assert.equal(subtask.effort, effortFromConfidence(subtask.confidence));
        assert.equal(typeof subtask.rationale, 'string');
        assert.ok(subtask.rationale.length > 0, `${request} -> ${subtask.agent} rationale`);
      }
    }
  } finally {
    console.warn = originalWarn;
  }
});

test('explicit task type yields deep effort and states the explicit choice as its rationale', () => {
  const [task] = decompose('find bugs, document the API, and trace the data flow', [], TASK_TYPES.DOCUMENTER);
  assert.equal(task.effort, 'deep');
  assert.match(task.rationale, /Explicit dashboard task type: documenter/);
});

test('full audit yields deep effort and a full-audit rationale for every agent', () => {
  const result = decompose('write only onboarding notes', [], TASK_TYPES.FULL_AUDIT);
  assert.ok(result.every((task) => task.effort === 'deep'));
  assert.ok(result.every((task) => /Full audit/.test(task.rationale)));
});

test('an unclassified fallback yields light effort for every agent', () => {
  const result = decompose('please inspect this repository');
  assert.ok(result.every((task) => task.effort === 'light'));
});
