/**
 * BobSwarm MCP — Git Tools
 * Owner: Lethabo (Backend Engineer)
 *
 * Provides Git integration tools so the BobSwarm orchestrator can inspect
 * repository state, history, and diffs without leaving Bob.
 */

'use strict';

const { z } = require('zod');
const simpleGit = require('simple-git');

/**
 * Registers all Git tools on the given MCP server instance.
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 */
function registerGitTools(server) {

  // ── git_status ────────────────────────────────────────────────────────────
  server.registerTool(
    'git_status',
    {
      description: 'Returns the current Git status of a repository (staged, unstaged, untracked files).',
      inputSchema: {
        repoPath: z.string().describe('Absolute or relative path to the Git repository root.'),
      },
    },
    async ({ repoPath }) => {
      const git = simpleGit(repoPath);
      const status = await git.status();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(status, null, 2),
          },
        ],
      };
    }
  );

  // ── git_log ───────────────────────────────────────────────────────────────
  server.registerTool(
    'git_log',
    {
      description: 'Returns the recent commit log for a repository.',
      inputSchema: {
        repoPath: z.string().describe('Path to the Git repository root.'),
        maxCount: z.number().int().min(1).max(100).default(20).describe('Number of commits to return.'),
      },
    },
    async ({ repoPath, maxCount }) => {
      const git = simpleGit(repoPath);
      const log = await git.log({ maxCount });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(log.all, null, 2),
          },
        ],
      };
    }
  );

  // ── git_diff ──────────────────────────────────────────────────────────────
  server.registerTool(
    'git_diff',
    {
      description: 'Returns the diff of uncommitted changes, or between two commits/branches.',
      inputSchema: {
        repoPath: z.string().describe('Path to the Git repository root.'),
        from: z.string().optional().describe('Base commit SHA, branch, or tag. Omit for working tree diff.'),
        to: z.string().optional().describe('Target commit SHA or branch.'),
      },
    },
    async ({ repoPath, from, to }) => {
      const git = simpleGit(repoPath);
      let diff;
      if (from && to) {
        diff = await git.diff([from, to]);
      } else if (from) {
        diff = await git.diff([from]);
      } else {
        diff = await git.diff();
      }
      return {
        content: [{ type: 'text', text: diff || '(no changes)' }],
      };
    }
  );

  // ── git_blame ─────────────────────────────────────────────────────────────
  server.registerTool(
    'git_blame',
    {
      description: 'Returns git blame output for a specific file.',
      inputSchema: {
        repoPath: z.string().describe('Path to the Git repository root.'),
        filePath: z.string().describe('Path to the file relative to the repository root.'),
      },
    },
    async ({ repoPath, filePath }) => {
      const git = simpleGit(repoPath);
      const blame = await git.raw(['blame', '--line-porcelain', filePath]);
      return {
        content: [{ type: 'text', text: blame }],
      };
    }
  );
}

module.exports = { registerGitTools };
