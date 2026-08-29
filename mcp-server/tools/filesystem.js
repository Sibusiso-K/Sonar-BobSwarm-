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

// Path-traversal boundary. Every filesystem tool call is LLM-directed (Bob or
// a subagent supplies the path), so a confused or adversarial call — e.g.
// filePath: "../../../../Windows/System32/..." — must not be able to read or
// write outside the project tree. Default root is this repo's own root
// (two levels up from mcp-server/tools/); override with BOBSWARM_ALLOWED_ROOT
// if a task ever needs to point at a target repo cloned elsewhere on disk.
const ALLOWED_ROOT = path.resolve(
  process.env.BOBSWARM_ALLOWED_ROOT || path.join(__dirname, '..', '..')
);

/**
 * Creates a path guard that validates both the lexical path and the real path.
 * The real-path check is important: a path can look as though it is inside the
 * project while a symlink/junction redirects reads or writes somewhere else.
 */
function createPathGuard(allowedRoot) {
  const lexicalRoot = path.resolve(allowedRoot);
  let realRootPromise;

  const realRoot = () => {
    realRootPromise ||= fs.realpath(lexicalRoot);
    return realRootPromise;
  };

  const isWithin = (root, candidate) => {
    const relative = path.relative(root, candidate);
    return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
  };

  return async function resolveWithinRoot(candidatePath) {
    if (typeof candidatePath !== 'string' || candidatePath.trim().length === 0) {
      throw new Error('path must be a non-empty string');
    }

    const canonicalRoot = await realRoot();
    const lexicalCandidate = path.resolve(lexicalRoot, candidatePath);
    if (!isWithin(lexicalRoot, lexicalCandidate) && !isWithin(canonicalRoot, lexicalCandidate)) {
      throw new Error(
        `path escapes the allowed project root: "${candidatePath}" resolved to "${lexicalCandidate}". Refusing.`
      );
    }

    // Resolve the nearest existing ancestor, then append the missing suffix.
    // This protects write targets that do not exist yet as well as reads.
    let existingAncestor = lexicalCandidate;
    const missingSegments = [];
    let canonicalCandidate;
    while (true) {
      try {
        const canonicalAncestor = await fs.realpath(existingAncestor);
        canonicalCandidate = path.resolve(canonicalAncestor, ...missingSegments.reverse());
        break;
      } catch (error) {
        if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error;
        const parent = path.dirname(existingAncestor);
        if (parent === existingAncestor) throw error;
        missingSegments.push(path.basename(existingAncestor));
        existingAncestor = parent;
      }
    }

    if (!isWithin(canonicalRoot, canonicalCandidate)) {
      throw new Error(
        `path escapes the allowed project root through a symlink or junction: "${candidatePath}" ` +
        `resolves to "${canonicalCandidate}". Refusing.`
      );
    }
    return canonicalCandidate;
  }
}

const resolveWithinAllowedRoot = createPathGuard(ALLOWED_ROOT);

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
      const safeRoot = await resolveWithinAllowedRoot(rootPath);
      const files = await glob(pattern, { cwd: safeRoot, ignore, nodir: true, follow: false });
      // Normalize to forward slashes: on Windows, glob returns native
      // backslash separators for nested paths, which then mismatches any
      // affected_path a subagent quotes in record_finding (LLM output tends
      // toward forward slashes regardless of host OS), breaking exact-match
      // validation against fixtures/expected_findings.json.
      const normalized = [];
      for (const file of files) {
        try {
          await resolveWithinAllowedRoot(path.resolve(safeRoot, file));
          normalized.push(file.split(path.sep).join('/'));
        } catch {
          // Do not expose a symlink/junction whose target leaves the project.
        }
      }
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
      const safePath = await resolveWithinAllowedRoot(filePath);
      const content = await fs.readFile(safePath, { encoding });
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
      const safeRoot = await resolveWithinAllowedRoot(rootPath);
      const allFiles = await glob('**/*', {
        cwd: safeRoot,
        ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/__pycache__/**'],
        nodir: true,
        follow: false,
      });

      // Same normalization and real-path filtering as list_project_files.
      const normalizedFiles = [];
      for (const file of allFiles) {
        try {
          await resolveWithinAllowedRoot(path.resolve(safeRoot, file));
          normalizedFiles.push(file.split(path.sep).join('/'));
        } catch {
          // Do not count a symlink/junction whose target leaves the project.
        }
      }

      const byExt = {};
      let totalBytes = 0;

      for (const file of normalizedFiles) {
        const ext = path.extname(file) || '(no ext)';
        try {
          const safeFile = await resolveWithinAllowedRoot(path.resolve(safeRoot, file));
          const stat = await fs.stat(safeFile);
          byExt[ext] = (byExt[ext] || 0) + 1;
          totalBytes += stat.size;
        } catch {
          // Skip unreadable files and links that leave the allowed root.
        }
      }

      // Detect likely entry points
      const entryPointCandidates = ['index.js', 'index.ts', 'main.py', 'app.py', 'main.go', 'Main.java'];
      const entryPoints = normalizedFiles.filter((f) =>
        entryPointCandidates.includes(path.basename(f))
      );

      const summary = {
        totalFiles: normalizedFiles.length,
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
      const safePath = await resolveWithinAllowedRoot(outputPath);
      await fs.mkdir(path.dirname(safePath), { recursive: true });
      await fs.writeFile(safePath, content, 'utf-8');
      return {
        content: [{ type: 'text', text: `Report written to: ${safePath}` }],
      };
    }
  );
}

module.exports = {
  ALLOWED_ROOT,
  createPathGuard,
  resolveWithinAllowedRoot,
  registerFilesystemTools,
};
