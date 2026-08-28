/**
 * BobSwarm MCP Server
 * Owner: Lethabo (Backend Engineer)
 *
 * Exposes Git integration and filesystem tools to the BobSwarm orchestrator
 * via the Model Context Protocol (MCP) stdio transport.
 *
 * Usage: Register this server in Bob's MCP config, then the orchestrator
 * can call these tools directly during a swarm run.
 */

'use strict';

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { registerGitTools } = require('./tools/git');
const { registerFilesystemTools } = require('./tools/filesystem');

async function main() {
  const server = new McpServer({
    name: 'bobswarm-mcp-server',
    version: '1.0.0',
  });

  // Register tool groups
  registerGitTools(server);
  registerFilesystemTools(server);

  // Connect via stdio (Bob's default MCP transport)
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('[BobSwarm MCP] Server running on stdio transport');
}

main().catch((err) => {
  console.error('[BobSwarm MCP] Fatal error:', err);
  process.exit(1);
});
