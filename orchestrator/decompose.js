/**
 * BobSwarm Task Decomposition Logic
 * Owner: Farheen (AI/ML Engineer)
 *
 * Parses a plain-language engineering request and returns an ordered list
 * of sub-tasks, each mapped to a specialist agent type.
 */

'use strict';

/**
 * Agent types available in the swarm.
 * @readonly
 * @enum {string}
 */
const AGENT_TYPES = {
  DEBUGGER: 'debugger',
  DOCUMENTER: 'documenter',
  REFACTORER: 'refactorer',
  ONBOARDING: 'onboarding',
  DATA_LINEAGE: 'data_lineage',
};

/**
 * Keyword → agent type mapping.
 * Order matters: first match wins for ambiguous input.
 */
const KEYWORD_MAP = [
  {
    agent: AGENT_TYPES.DEBUGGER,
    keywords: ['bug', 'error', 'crash', 'exception', 'fail', 'broken', 'fix', 'issue', 'debug'],
  },
  {
    agent: AGENT_TYPES.DOCUMENTER,
    keywords: ['document', 'docs', 'api doc', 'comment', 'jsdoc', 'docstring', 'readme', 'explain'],
  },
  {
    agent: AGENT_TYPES.REFACTORER,
    keywords: ['refactor', 'clean', 'improve', 'modernise', 'modernize', 'optimise', 'optimize', 'rewrite'],
  },
  {
    agent: AGENT_TYPES.ONBOARDING,
    keywords: ['onboard', 'new developer', 'getting started', 'walkthrough', 'guide', 'introduce'],
  },
  {
    agent: AGENT_TYPES.DATA_LINEAGE,
    keywords: ['data flow', 'lineage', 'pipeline', 'trace', 'where does', 'origin', 'source of'],
  },
];

/**
 * Decomposes a plain-language request into an array of sub-tasks.
 *
 * @param {string} request - The raw user request.
 * @param {string[]} [contextFiles=[]] - File paths relevant to all sub-tasks.
 * @returns {SubTask[]} Ordered array of sub-tasks (independent tasks first).
 *
 * @typedef {Object} SubTask
 * @property {string} agent      - Agent type from AGENT_TYPES
 * @property {string} task       - Scoped task description for the subagent
 * @property {string[]} context  - File paths the subagent should read
 * @property {boolean} parallel  - Whether this task can run in parallel
 * @property {string[]} dependsOn - Agent types that must complete before this runs
 */
function decompose(request, contextFiles = []) {
  const lower = request.toLowerCase();
  const matched = new Set();
  const subtasks = [];

  for (const { agent, keywords } of KEYWORD_MAP) {
    if (keywords.some((kw) => lower.includes(kw))) {
      matched.add(agent);
    }
  }

  // If nothing matched, default to a full audit
  if (matched.size === 0) {
    console.warn('[BobSwarm] No specific task type detected — defaulting to full audit.');
    Object.values(AGENT_TYPES).forEach((a) => matched.add(a));
  }

  // Build sub-tasks with dependency rules
  // Rule: refactorer depends on debugger (needs to know what's broken first)
  const parallelAgents = [
    AGENT_TYPES.DEBUGGER,
    AGENT_TYPES.DOCUMENTER,
    AGENT_TYPES.ONBOARDING,
    AGENT_TYPES.DATA_LINEAGE,
  ];

  for (const agent of parallelAgents) {
    if (matched.has(agent)) {
      subtasks.push({
        agent,
        task: buildTaskDescription(agent, request),
        context: contextFiles,
        parallel: true,
        dependsOn: [],
      });
    }
  }

  // Refactorer runs after debugger if both are present
  if (matched.has(AGENT_TYPES.REFACTORER)) {
    subtasks.push({
      agent: AGENT_TYPES.REFACTORER,
      task: buildTaskDescription(AGENT_TYPES.REFACTORER, request),
      context: contextFiles,
      parallel: !matched.has(AGENT_TYPES.DEBUGGER),
      dependsOn: matched.has(AGENT_TYPES.DEBUGGER) ? [AGENT_TYPES.DEBUGGER] : [],
    });
  }

  return subtasks;
}

/**
 * Builds a scoped task description for a specific agent type.
 *
 * @param {string} agent   - Agent type
 * @param {string} request - Original user request
 * @returns {string}
 */
function buildTaskDescription(agent, request) {
  const descriptions = {
    [AGENT_TYPES.DEBUGGER]: `Analyse the provided codebase for bugs, errors, and unexpected behaviour.
Original request context: "${request}"
Deliverable: A numbered list of issues found, each with file path, line reference, root cause, and suggested fix.`,

    [AGENT_TYPES.DOCUMENTER]: `Generate comprehensive documentation for the provided codebase.
Original request context: "${request}"
Deliverable: Inline code comments, a public API reference, and a high-level module overview.`,

    [AGENT_TYPES.REFACTORER]: `Identify and apply refactoring improvements to the provided codebase.
Use any debugger findings (passed in context) to avoid re-introducing known bugs.
Original request context: "${request}"
Deliverable: A diff-style list of recommended changes with rationale for each.`,

    [AGENT_TYPES.ONBOARDING]: `Create an onboarding guide for a developer who is new to this codebase.
Original request context: "${request}"
Deliverable: A structured getting-started document covering setup, architecture overview, key files, and first-contribution workflow.`,

    [AGENT_TYPES.DATA_LINEAGE]: `Trace the data flow through the provided codebase.
Original request context: "${request}"
Deliverable: A data lineage map showing where data enters the system, how it is transformed, and where it exits or is stored.`,
  };

  return descriptions[agent] || `Complete the following engineering task: "${request}"`;
}

module.exports = { decompose, AGENT_TYPES, KEYWORD_MAP };
