/**
 * Decompose test harness — Farheen (AI/ML Engineer)
 * Run: node orchestrator/_test_decompose.js
 */
const { decompose } = require('./decompose');

const tests = [
  // 1–5: single-agent triggers
  'find all the bugs and document the API',
  'refactor the legacy code',
  'onboard a new developer to this project',
  'trace the data flow through the pipeline',
  'the app is crashing on startup',
  // 6–10: refined keyword coverage
  'clean up and improve the codebase',
  'write getting started guide for new devs',
  'what is the origin of this data',
  'fix exceptions and optimise performance',
  'analyse the codebase. Find all bugs, document the public API, suggest refactoring, trace the data flow, and write an onboarding guide.',
  // 11–14: edge cases / previously unmatched
  'review the code',
  'security audit the application',
  'explain the architecture',
  'how does the data transformation work',
];

let pass = 0;
let warn = 0;

tests.forEach((t, i) => {
  const result = decompose(t, ['demo/sample-project/app.py']);
  const summary = result.map((s) => {
    const dep = s.dependsOn.length ? ' (after:' + s.dependsOn.join(',') + ')' : '';
    return s.agent + dep + ' conf=' + s.confidence;
  }).join(', ');
  console.log('Test ' + (i + 1) + ': "' + t.substring(0, 72) + '"');
  console.log('  Agents: ' + summary);
  console.log('');
});

// --- Explicit Refactorer dependency rule verification ---
console.log('--- Refactorer Dependency Rule Verification ---');
const r1 = decompose('fix bugs and refactor the code', []);
const refactorer1 = r1.find((s) => s.agent === 'refactorer');
const debugger1   = r1.find((s) => s.agent === 'debugger');
console.assert(refactorer1 !== undefined, 'FAIL: refactorer not present');
console.assert(debugger1 !== undefined,   'FAIL: debugger not present');
console.assert(refactorer1.parallel === false, 'FAIL: refactorer should be sequential');
console.assert(refactorer1.dependsOn.includes('debugger'), 'FAIL: refactorer should depend on debugger');
console.log('PASS: refactorer.parallel=false, dependsOn=[debugger]');

const r2 = decompose('refactor the code', []);
const refactorer2 = r2.find((s) => s.agent === 'refactorer');
console.assert(refactorer2.parallel === true, 'FAIL: refactorer alone should be parallel');
console.assert(refactorer2.dependsOn.length === 0, 'FAIL: refactorer alone should have no deps');
console.log('PASS: refactorer alone is parallel with no deps');

// --- Confidence score verification ---
console.log('');
console.log('--- Confidence Score Verification ---');
const c1 = decompose('bug crash error exception fail broken fix issue debug', []);
const debuggerC = c1.find((s) => s.agent === 'debugger');
console.assert(debuggerC.confidence > 0, 'FAIL: confidence should be > 0');
console.assert(debuggerC.confidence <= 1.0, 'FAIL: confidence should be <= 1.0');
console.log('PASS: confidence in range [0,1], value=' + debuggerC.confidence);

console.log('');
console.log('All checks complete.');
