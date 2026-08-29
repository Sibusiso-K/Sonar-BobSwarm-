/**
 * BobSwarm MCP — Swarm Lifecycle Tools
 * Owner: Lethabo (Backend Engineer)
 *
 * These are the tools the orchestrator and its subagents call to make swarm
 * activity real and structured, instead of living only in Bob's chat
 * transcript. record_finding requires a literal evidence quote — no
 * paraphrase, no inferred claim — matching the extract-don't-infer rule
 * already used in the persona instructions.
 *
 * These complement (don't replace) the existing git.js / filesystem.js tools:
 * those give subagents read access to the target repo, these give them a
 * structured way to report what they found.
 */

'use strict';

const { z } = require('zod');
const store = require('./../store');

function registerSwarmTools(server) {
  server.registerTool(
    'record_progress',
    {
      description: 'Report a subagent\'s status for the live dashboard. Call at start, at least once while investigating, and when done.',
      inputSchema: {
        runId: z.string().describe('The run this subagent belongs to.'),
        subagentRole: z.string().describe('e.g. debugger, documenter, refactorer, onboarding, data_lineage.'),
        status: z.enum(['started', 'investigating', 'done']),
        detail: z.string().optional().describe('Short human-readable detail, e.g. current file being examined.'),
      },
    },
    async ({ runId, subagentRole, status, detail }) => {
      const event = store.recordProgress(runId, subagentRole, status, detail);
      return { content: [{ type: 'text', text: JSON.stringify(event) }] };
    }
  );

  server.registerTool(
    'record_finding',
    {
      description:
        'Record one structured finding. Call once per distinct observation, not once per subagent overall. ' +
        'evidence MUST be a literal quoted span from a file actually read via read_project_file — never a summary or a guess. ' +
        'If you cannot find literal evidence for a claim, do not call this tool for that claim.',
      inputSchema: {
        runId: z.string(),
        subagentRole: z.string(),
        targetSymbol: z.string().describe('The field, function, file, or program name the finding is about.'),
        affectedPath: z.string().describe('Path to the file where the impact/observation was found.'),
        severity: z.enum(['breaks', 'warns', 'informational']),
        evidence: z.string().min(1).describe('Literal quoted source text supporting this finding.'),
      },
    },
    async ({ runId, subagentRole, targetSymbol, affectedPath, severity, evidence }) => {
      const finding = store.recordFinding(runId, { subagentRole, targetSymbol, affectedPath, severity, evidence });
      return { content: [{ type: 'text', text: JSON.stringify(finding) }] };
    }
  );

  server.registerTool(
    'finalize_run',
    {
      description: 'Marks a running run complete and returns the aggregated, deterministically-sorted report. Safe to retry: repeated calls return the original final report without emitting another completion event.',
      inputSchema: {
        runId: z.string(),
      },
    },
    async ({ runId }) => {
      const report = store.finalizeRun(runId);
      return { content: [{ type: 'text', text: JSON.stringify(report, null, 2) }] };
    }
  );

  server.registerTool(
    'get_run_report',
    {
      description: 'Fetch the current partial or final aggregated report without changing the run status. Pending and running reports are explicitly marked isFinal: false.',
      inputSchema: {
        runId: z.string(),
      },
    },
    async ({ runId }) => {
      const report = store.getReport(runId);
      return { content: [{ type: 'text', text: JSON.stringify(report, null, 2) }] };
    }
  );
}

module.exports = { registerSwarmTools };
