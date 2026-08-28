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
const { registerSwarmTools } = require('./tools/swarm');
const { startEventsServer } = require('./events-server');

async function main() {
  const server = new McpServer({
    name: 'bobswarm-mcp-server',
    version: '1.0.0',
  });

  // Register tool groups
  registerGitTools(server);
  registerFilesystemTools(server);
  registerSwarmTools(server); // record_progress, record_finding, finalize_run, get_run_report

  // Side-channel HTTP+WebSocket server so the browser dashboard can see swarm
  // activity live. Bob only speaks stdio to this process; this is the bridge
  // that replaces frontend/app.js's simulateSwarm() with real events.
  startEventsServer();

  // Connect via stdio (Bob's default MCP transport)
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('[BobSwarm MCP] Server running on stdio transport');
}

main().catch((err) => {
  console.error('[BobSwarm MCP] Fatal error:', err);
  process.exit(1);
});
