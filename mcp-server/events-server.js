/**
 * BobSwarm — Live Events Server
 * Owner: Lethabo (Backend Engineer)
 *
 * Replaces frontend/app.js's simulateSwarm() with a real feed. This is a
 * small side-channel HTTP+WebSocket server that runs alongside the MCP stdio
 * server (Bob talks to the MCP server over stdio; the browser can't attach to
 * that, so this is the bridge to the dashboard).
 *
 * Endpoints:
 *   POST /runs                    { taskDescription, taskType, repoRef } -> Run
 *   GET  /runs/:id                -> Run
 *   GET  /runs/:id/report         -> Report (finalizes on read if still running)
 *   WS   /runs/:id/events         -> live { type: "progress"|"finding"|"run_complete", ... }
 *
 * Integration note for Arisha (frontend): connect to
 * ws://localhost:8787/runs/<id>/events and replace simulateSwarm()'s fake
 * timers with real handlers for these three event types — see
 * docs/LIVE_EVENTS.md for the exact payload shapes.
 *
 * Run standalone for local dev: node events-server.js
 * In production it's started from server.js alongside the MCP stdio transport.
 */

'use strict';

const http = require('http');
const { WebSocketServer } = require('ws');
const store = require('./store');

const PORT = process.env.BOBSWARM_EVENTS_PORT || 8787;

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*', // fine for a hackathon demo; tighten if there's time
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function startEventsServer() {
  const server = http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      return res.end();
    }

    const url = new URL(req.url, `http://localhost:${PORT}`);
    const parts = url.pathname.split('/').filter(Boolean); // ['runs', ':id', ...]

    try {
      if (req.method === 'POST' && parts[0] === 'runs' && parts.length === 1) {
        const body = await readBody(req);
        if (!body.taskDescription || !body.taskType || !body.repoRef) {
          return sendJson(res, 400, { error: 'taskDescription, taskType, and repoRef are required' });
        }
        const run = store.createRun(body);
        store.armTimeout(run.id);
        return sendJson(res, 201, run);
      }

      if (req.method === 'GET' && parts[0] === 'runs' && parts.length === 1) {
        return sendJson(res, 200, store.listRuns());
      }

      if (req.method === 'GET' && parts[0] === 'runs' && parts.length === 2) {
        return sendJson(res, 200, store.getRun(parts[1]));
      }

      if (req.method === 'GET' && parts[0] === 'runs' && parts.length === 3 && parts[2] === 'report') {
        return sendJson(res, 200, store.getReport(parts[1]));
      }

      sendJson(res, 404, { error: 'not found' });
    } catch (err) {
      sendJson(res, 400, { error: err.message });
    }
  });

  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const parts = url.pathname.split('/').filter(Boolean); // ['runs', ':id', 'events']

    if (parts[0] !== 'runs' || parts[2] !== 'events') {
      socket.destroy();
      return;
    }
    const runId = parts[1];

    wss.handleUpgrade(req, socket, head, (ws) => {
      try {
        store.getRun(runId); // throws if unknown run — reject the upgrade cleanly
      } catch {
        ws.close(1008, 'unknown run_id');
        return;
      }
      store.subscribe(runId, ws);
      ws.on('close', () => store.unsubscribe(runId, ws));
    });
  });

  // Critical: a failure here must NOT crash the whole process. server.js
  // starts this alongside the MCP stdio transport that Bob actually depends
  // on — if this server's port is already taken (a stray process from an
  // earlier session, another team member's server, etc.) and this throws
  // unhandled, it kills the entire MCP connection, not just the live-events
  // dashboard feed. Confirmed this exact failure mode directly: EADDRINUSE
  // on an unhandled 'error' event took down the whole process before Bob's
  // stdio transport could even connect.
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `[BobSwarm events] port ${PORT} already in use — live dashboard events ` +
        `will not be available this session, but MCP tools (git/filesystem/swarm) ` +
        `still work normally. Free the port and restart to get live events back: ` +
        `find the process holding it and stop it, or set BOBSWARM_EVENTS_PORT to a free port.`
      );
      return;
    }
    console.error('[BobSwarm events] server error (non-fatal, MCP tools unaffected):', err.message);
  });

  server.listen(PORT, () => {
    console.error(`[BobSwarm events] listening on http://localhost:${PORT}`);
  });

  return server;
}

module.exports = { startEventsServer };

if (require.main === module) {
  startEventsServer();
}
