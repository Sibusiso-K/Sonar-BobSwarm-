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

const TASK_TYPES = {
  FULL_AUDIT: 'full_audit',
  ...AGENT_TYPES,
};

const RUN_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Keyword → agent type mapping.
 * Requests may match multiple agents. Array order keeps routing deterministic;
 * it is not a first-match-wins classifier.
 *
 * Keyword coverage verified against 14 test requests (see HANDOVER.md — Farheen section).
 */
const KEYWORD_MAP = [
  {
    agent: AGENT_TYPES.DEBUGGER,
    keywords: [
      'bug', 'error', 'crash', 'exception', 'fail', 'failure', 'broken', 'fix', 'issue', 'debug',
      // Added: security issues are a subset of defects; test/spec failures surface as bugs
      'security', 'vulnerability', 'test fail', 'spec fail', 'not working', 'wrong output',
    ],
  },
  {
    agent: AGENT_TYPES.DOCUMENTER,
    keywords: [
      'document', 'docs', 'api doc', 'comment', 'jsdoc', 'docstring', 'readme', 'explain',
      // Added: architecture explanations + API exploration requests
      'architecture', 'api reference', 'how does', 'describe', 'summarise', 'summarize',
    ],
  },
  {
    agent: AGENT_TYPES.REFACTORER,
    keywords: [
      'refactor', 'clean', 'improve', 'modernise', 'modernize', 'optimise', 'optimize', 'rewrite',
      // Added: code quality / performance requests that imply structural change
      'performance', 'simplify', 'restructure', 'technical debt', 'code quality',
    ],
  },
  {
    agent: AGENT_TYPES.ONBOARDING,
    keywords: [
      'onboard', 'new developer', 'getting started', 'walkthrough', 'guide', 'introduce',
      // Added: common phrasings for onboarding requests
      'new dev', 'new engineer', 'first contribution', 'setup guide', 'how to start',
    ],
  },
  {
    agent: AGENT_TYPES.DATA_LINEAGE,
    keywords: [
      'data flow', 'lineage', 'pipeline', 'trace', 'where does', 'origin', 'source of',
      // Added: common data-tracing phrasings
      'data source', 'data origin', 'where is data', 'data path', 'data transformation',
      'etl', 'ingestion', 'data map',
    ],
  },
];

/**
 * Computes a confidence score (0.0–1.0) for an agent assignment.
 *
 * Score reflects match strength without dividing by the synonym-list length.
 * The first match establishes relevance at 0.60; each additional independent
 * match adds 0.15, capped at 1.0. Adding routing synonyms therefore cannot
 * make an unchanged request appear less confident.
 * A default full-audit fallback always assigns a score of 0.5.
 *
 * @param {string} lower        - Lowercased request string.
 * @param {string[]} keywords   - Keyword list for the agent being scored.
 * @returns {number} Confidence score rounded to 2 decimal places.
 */
function computeConfidence(lower, keywords) {
  const matchCount = keywords.filter((keyword) => matchesKeyword(lower, keyword)).length;
  if (matchCount === 0) return 0;
  return Math.min(1, Math.round((0.6 + ((matchCount - 1) * 0.15)) * 100) / 100);
}

/**
 * Maps a confidence score to a coarse effort level. Deliberately coarse —
 * this is a planning signal for the subagent, not a fine-grained knob.
 * An explicit taskType always yields confidence 1, so it always maps to
 * 'deep': explicit user intent warrants full depth, by design, not by accident.
 * @param {number} confidence
 * @returns {'light'|'standard'|'deep'}
 */
function effortFromConfidence(confidence) {
  if (confidence >= 0.9) return 'deep';
  if (confidence >= 0.6) return 'standard';
  return 'light';
}

/**
 * Short, deterministic, evidence-based explanation of why an agent was
 * included — never a generated or inferred claim, matching this project's
 * extract-don't-infer doctrine. matchedKeywords is only populated on the
 * free-text routing path; the explicit-taskType paths are self-explanatory.
 * @param {string} agent
 * @param {string} [taskType]
 * @param {string[]} [matchedKeywords]
 * @returns {string}
 */
function buildRationale(agent, taskType, matchedKeywords) {
  if (taskType === TASK_TYPES.FULL_AUDIT) {
    return 'Full audit: all five specialists included.';
  }
  if (taskType && taskType === agent) {
    return `Explicit dashboard task type: ${agent}.`;
  }
  if (matchedKeywords && matchedKeywords.length > 0) {
    return `Matched keywords: ${matchedKeywords.join(', ')}.`;
  }
  return 'No specific match — included via full-audit fallback.';
}

/**
 * Matches a keyword or phrase on token boundaries, with a small set of common
 * English inflections on the final token. This accepts "bugs" for "bug" but
 * does not accept substring collisions such as "issue" inside "tissue".
 *
 * @param {string} text
 * @param {string} keyword
 * @returns {boolean}
 */
function matchesKeyword(text, keyword) {
  if (typeof text !== 'string' || typeof keyword !== 'string' || keyword.trim().length === 0) {
    return false;
  }

  const tokens = keyword.trim().toLowerCase().split(/\s+/);
  const finalToken = tokens.pop();
  const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const variants = new Set([finalToken]);
  if (finalToken.endsWith('e')) {
    variants.add(`${finalToken}s`);
    variants.add(`${finalToken}d`);
    variants.add(`${finalToken.slice(0, -1)}ing`);
  } else {
    variants.add(`${finalToken}s`);
    variants.add(`${finalToken}es`);
    variants.add(`${finalToken}ed`);
    variants.add(`${finalToken}ing`);
  }

  const prefix = tokens.length > 0
    ? `${tokens.map(escapeRegex).join('\\s+')}\\s+`
    : '';
  const finalPattern = [...variants].map(escapeRegex).join('|');
  const pattern = new RegExp(`(?:^|[^a-z0-9_])${prefix}(?:${finalPattern})(?=$|[^a-z0-9_])`, 'i');
  return pattern.test(text);
}

/**
 * Decomposes a plain-language request into an array of sub-tasks.
 *
 * @param {string} request - The raw user request.
 * @param {string[]} [contextFiles=[]] - File paths relevant to all sub-tasks.
 * @param {string} [taskType] - Explicit dashboard task type. When supplied,
 *   it is authoritative and prevents keyword matches from widening the run.
 * @returns {SubTask[]} Ordered array of sub-tasks (independent tasks first).
 *
 * @typedef {Object} SubTask
 * @property {string}   agent                - Agent type from AGENT_TYPES
 * @property {string}   task                 - Scoped task description for the subagent
 * @property {string[]} context              - File paths the subagent should read
 * @property {boolean}  parallel             - Whether this task can run in parallel
 * @property {string[]} dependsOn            - Agent types that must complete before this runs
 * @property {number}   confidence           - Score 0.0–1.0: keyword match strength for this agent
 * @property {boolean}  lowConfidenceWarning - True for an unclassified request
 *   that fell back to a full audit.
 */
function decompose(request, contextFiles = [], taskType) {
  if (typeof request !== 'string' || request.trim().length === 0) {
    throw new TypeError('request must be a non-empty string');
  }
  if (!Array.isArray(contextFiles) || contextFiles.some((file) => typeof file !== 'string')) {
    throw new TypeError('contextFiles must be an array of file paths');
  }
  if (taskType !== undefined && taskType !== null && taskType !== ''
    && !Object.values(TASK_TYPES).includes(taskType)) {
    throw new TypeError('taskType must be full_audit or a supported specialist type');
  }

  const lower = request.toLowerCase();
  const matched = new Map(); // agent → confidence score
  const matchedKeywordsByAgent = new Map(); // agent → keywords that actually matched (free-text routing only)
  const subtasks = [];

  if (taskType && taskType !== TASK_TYPES.FULL_AUDIT) {
    matched.set(taskType, 1);
  } else if (taskType === TASK_TYPES.FULL_AUDIT) {
    Object.values(AGENT_TYPES).forEach((agent) => matched.set(agent, 1));
  } else {
    for (const { agent, keywords } of KEYWORD_MAP) {
      const hits = keywords.filter((keyword) => matchesKeyword(lower, keyword));
      if (hits.length > 0) {
        matched.set(agent, computeConfidence(lower, keywords));
        matchedKeywordsByAgent.set(agent, hits);
      }
    }

    // If nothing matched, default to a full audit.
    if (matched.size === 0) {
      console.warn('[BobSwarm] No specific task type detected — defaulting to full audit.');
      Object.values(AGENT_TYPES).forEach((a) => matched.set(a, 0.5));
    }
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
      const confidence = matched.get(agent);
      subtasks.push({
        agent,
        task: buildTaskDescription(agent, request),
        context: [...contextFiles],
        parallel: true,
        dependsOn: [],
        confidence,
        lowConfidenceWarning: confidence <= 0.5,
        effort: effortFromConfidence(confidence),
        rationale: buildRationale(agent, taskType, matchedKeywordsByAgent.get(agent)),
      });
    }
  }

  // Refactorer runs after debugger if both are present
  if (matched.has(AGENT_TYPES.REFACTORER)) {
    const confidence = matched.get(AGENT_TYPES.REFACTORER);
    subtasks.push({
      agent: AGENT_TYPES.REFACTORER,
      task: buildTaskDescription(AGENT_TYPES.REFACTORER, request),
      context: [...contextFiles],
      parallel: !matched.has(AGENT_TYPES.DEBUGGER),
      dependsOn: matched.has(AGENT_TYPES.DEBUGGER) ? [AGENT_TYPES.DEBUGGER] : [],
      confidence,
      lowConfidenceWarning: confidence <= 0.5,
      effort: effortFromConfidence(confidence),
      rationale: buildRationale(AGENT_TYPES.REFACTORER, taskType, matchedKeywordsByAgent.get(AGENT_TYPES.REFACTORER)),
    });
  }

  return subtasks;
}

/**
 * Builds the complete text passed to spawn_subagent.
 *
 * Keeping the lifecycle/evidence contract in this deterministic helper prevents
 * the orchestrator from dispatching a persona-only prompt that cannot report to
 * the dashboard. The dashboard creates the run; this helper only accepts that
 * existing UUID and never creates or invents one.
 *
 * @param {Object} options
 * @param {SubTask} options.subtask - A sub-task returned by decompose().
 * @param {string} options.runId - Exact run ID copied from the dashboard.
 * @param {string} options.personaPrompt - Contents of agents/<type>.md.
 * @param {string} [options.dependencyContext] - Debugger result for a dependent refactorer.
 * @returns {string} Complete spawn_subagent payload.
 */
function buildDispatchPayload({ subtask, runId, personaPrompt, dependencyContext = '' }) {
  if (!subtask || typeof subtask !== 'object' || !Object.values(AGENT_TYPES).includes(subtask.agent)) {
    throw new TypeError('subtask must be a valid result from decompose()');
  }
  if (typeof runId !== 'string' || !RUN_ID_PATTERN.test(runId.trim())) {
    throw new TypeError('runId must be the existing UUID copied from the BobSwarm dashboard');
  }
  if (typeof personaPrompt !== 'string' || personaPrompt.trim().length === 0) {
    throw new TypeError('personaPrompt must contain the specialist persona');
  }

  const dependsOnDebugger = Array.isArray(subtask.dependsOn)
    && subtask.dependsOn.includes(AGENT_TYPES.DEBUGGER);
  if (dependsOnDebugger && (typeof dependencyContext !== 'string' || dependencyContext.trim().length === 0)) {
    throw new Error('refactorer dispatch requires completed debugger findings as dependencyContext');
  }

  const context = Array.isArray(subtask.context) && subtask.context.length > 0
    ? subtask.context.map((file) => `- ${file}`).join('\n')
    : '- Inspect the repository paths needed for the scoped task.';
  const dependencySection = dependsOnDebugger
    ? `\n[DEPENDENCY CONTEXT — DEBUGGER COMPLETED]\n${dependencyContext.trim()}\n`
    : '';
  const role = subtask.agent;
  const exactRunId = runId.trim();

  return `[SPECIALIST PERSONA]\n${personaPrompt.trim()}\n\n` +
    `[SCOPED TASK]\n${subtask.task}\n\n` +
    `[CONTEXT PATHS]\n${context}\n` +
    dependencySection +
    `\n[MANDATORY MCP REPORTING CONTRACT]\n` +
    `Use runId exactly as provided: ${exactRunId}\n` +
    `Use subagentRole exactly as provided: ${role}\n` +
    `1. Call record_progress(runId="${exactRunId}", subagentRole="${role}", status="started") before investigation.\n` +
    `2. Read each source through read_project_file before making a claim.\n` +
    `3. Call record_progress with status="investigating" at least once while reading.\n` +
    `4. Call record_finding once per distinct source-backed observation. evidence must be a literal quoted span from a file actually read; never paraphrase or infer it. severity must be exactly breaks, warns, or informational. If literal evidence is unavailable, do not record that claim.\n` +
    `5. Call record_progress with status="done" exactly once after all findings are recorded.\n` +
    `6. Return your concise specialist result to the orchestrator; do not call finalize_run.`;
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
This applies to any language — Python, JavaScript, TypeScript, Java, or other.
Original request context: "${request}"
Deliverable: A numbered list of issues found, each with file path, line reference, root cause, and suggested fix.`,

    [AGENT_TYPES.DOCUMENTER]: `Generate comprehensive documentation for the provided codebase.
This applies to any language — use the appropriate doc style (docstrings, JSDoc, Javadoc, etc.).
Original request context: "${request}"
Deliverable: Inline code comments, a public API reference, and a high-level module overview.`,

    [AGENT_TYPES.REFACTORER]: `Identify targeted refactoring improvements for the provided codebase.
This applies to any language — use idiomatic patterns for whatever language is present.
Use the completed debugger findings passed as dependencyContext to avoid conflicting with known bugs.
Original request context: "${request}"
Deliverable: A diff-style list of recommended changes with rationale for each.`,

    [AGENT_TYPES.ONBOARDING]: `Create an onboarding guide for a developer who is new to this codebase.
This applies to any language or framework — explain the stack clearly regardless of technology.
Original request context: "${request}"
Deliverable: A structured getting-started document covering setup, architecture overview, key files, and first-contribution workflow.`,

    [AGENT_TYPES.DATA_LINEAGE]: `Trace the data flow through the provided codebase.
This applies to any language — follow data from ingress to egress regardless of implementation.
Original request context: "${request}"
Deliverable: A data lineage map showing where data enters the system, how it is transformed, and where it exits or is stored.`,
  };

  return descriptions[agent] || `Complete the following engineering task: "${request}"`;
}

module.exports = {
  decompose,
  buildDispatchPayload,
  AGENT_TYPES,
  TASK_TYPES,
  KEYWORD_MAP,
  RUN_ID_PATTERN,
  computeConfidence,
  matchesKeyword,
  effortFromConfidence,
  buildRationale,
};
