/**
 * BobSwarm MCP — Filesystem Tools
 * Owner: Lethabo (Backend Engineer)
 *
 * Provides filesystem scanning tools so the BobSwarm orchestrator can build
 * a picture of a project's structure before dispatching subagents.
 */

'use strict';

const { z } = require('zod');
const fs = require('fs/promises');
const path = require('path');
const { glob } = require('glob');

/**
 * Registers all filesystem tools on the given MCP server instance.
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 */
function registerFilesystemTools(server) {

  // ── list_files ────────────────────────────────────────────────────────────
  server.registerTool(
    'list_project_files',
    {
      description: 'Returns a recursive list of all source files in a project directory, with optional glob filtering.',
      inputSchema: {
        rootPath: z.string().describe('Absolute or relative path to the project root.'),
        pattern: z.string().default('**/*').describe('Glob pattern to filter files (e.g. "**/*.py").'),
        ignore: z.array(z.string()).default(['**/node_modules/**', '**/.git/**', '**/dist/**', '**/__pycache__/**'])
          .describe('Glob patterns to exclude.'),
      },
    },
    async ({ rootPath, pattern, ignore }) => {
      const files = await glob(pattern, { cwd: rootPath, ignore, nodir: true });
      // Normalize to forward slashes: on Windows, glob returns native
      // backslash separators for nested paths, which then mismatches any
      // affected_path a subagent quotes in record_finding (LLM output tends
      // toward forward slashes regardless of host OS), breaking exact-match
      // validation against fixtures/expected_findings.json.
      const normalized = files.map((f) => f.split(path.sep).join('/'));
      return {
        content: [{ type: 'text', text: normalized.join('\n') }],
      };
    }
  );

  // ── read_file ─────────────────────────────────────────────────────────────
  server.registerTool(
    'read_project_file',
    {
      description: 'Reads the content of a single file in the project.',
      inputSchema: {
        filePath: z.string().describe('Absolute path to the file.'),
        encoding: z.string().default('utf-8').describe('File encoding.'),
      },
    },
    async ({ filePath, encoding }) => {
      const content = await fs.readFile(filePath, { encoding });
      return {
        content: [{ type: 'text', text: content }],
      };
    }
  );

  // ── project_summary ───────────────────────────────────────────────────────
  server.registerTool(
    'project_summary',
    {
      description: 'Returns a high-level summary of a project: file count by extension, total size, entry points.',
      inputSchema: {
        rootPath: z.string().describe('Path to the project root.'),
      },
    },
    async ({ rootPath }) => {
      const allFiles = await glob('**/*', {
        cwd: rootPath,
        ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/__pycache__/**'],
        nodir: true,
      });

      // Same normalization as list_project_files — see comment there.
      const normalizedFiles = allFiles.map((f) => f.split(path.sep).join('/'));

      const byExt = {};
      let totalBytes = 0;

      for (const file of normalizedFiles) {
        const ext = path.extname(file) || '(no ext)';
        byExt[ext] = (byExt[ext] || 0) + 1;
        try {
          const stat = await fs.stat(path.join(rootPath, file));
          totalBytes += stat.size;
        } catch {
          // skip unreadable files
        }
      }

      // Detect likely entry points
      const entryPointCandidates = ['index.js', 'index.ts', 'main.py', 'app.py', 'main.go', 'Main.java'];
      const entryPoints = normalizedFiles.filter((f) =>
        entryPointCandidates.includes(path.basename(f))
      );

      const summary = {
        totalFiles: allFiles.length,
        totalSizeKB: Math.round(totalBytes / 1024),
        filesByExtension: byExt,
        likelyEntryPoints: entryPoints,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }],
      };
    }
  );

  // ── write_report ──────────────────────────────────────────────────────────
  server.registerTool(
    'write_swarm_report',
    {
      description: 'Writes the final BobSwarm aggregated report to a markdown file in the project.',
      inputSchema: {
        outputPath: z.string().describe('Absolute path for the output report file.'),
        content: z.string().describe('Full markdown content of the report.'),
      },
    },
    async ({ outputPath, content }) => {
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, content, 'utf-8');
      return {
        content: [{ type: 'text', text: `Report written to: ${outputPath}` }],
      };
    }
  );
}

module.exports = { registerFilesystemTools };
