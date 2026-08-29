/**
 * BobSwarm — HTTP and WebSocket events bridge.
 *
 * Bob uses the MCP stdio transport; the dashboard uses this local bridge.
 * Events are persisted by store.js, so every connection starts with an
 * authoritative snapshot and can reconnect using ?after=<sequence>.
 */

'use strict';

const http = require('http');
const { WebSocketServer } = require('ws');
const store = require('./store');

const DEFAULT_PORT = 8787;
const DEFAULT_HOST = '127.0.0.1';
const parsedBodyLimit = Number.parseInt(process.env.BOBSWARM_MAX_BODY_BYTES || '', 10);
const MAX_BODY_BYTES = Number.isSafeInteger(parsedBodyLimit) && parsedBodyLimit > 0
  ? parsedBodyLimit
  : 32 * 1024;

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
];
const allowedOrigins = new Set(
  (process.env.BOBSWARM_ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS.join(','))
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);

class HttpError extends Error {
  constructor(statusCode, message, code = 'BAD_REQUEST') {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

function isOriginAllowed(req) {
  const origin = req.headers.origin;
  return !origin || allowedOrigins.has(origin);
}

function responseHeaders(req) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  };
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers.Vary = 'Origin';
  }
  return headers;
}

function sendJson(req, res, status, body) {
  if (res.headersSent || res.destroyed) return;
  res.writeHead(status, responseHeaders(req));
  res.end(JSON.stringify(body));
}

function readJsonBody(req, maxBytes = MAX_BODY_BYTES) {
  const contentType = (req.headers['content-type'] || '').split(';', 1)[0].trim().toLowerCase();
  if (contentType !== 'application/json') {
    throw new HttpError(415, 'Content-Type must be application/json', 'UNSUPPORTED_MEDIA_TYPE');
  }

  const contentLength = Number.parseInt(req.headers['content-length'] || '', 10);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new HttpError(413, `request body exceeds ${maxBytes} bytes`, 'PAYLOAD_TOO_LARGE');
  }

  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;
    let settled = false;

    const fail = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    req.on('data', (chunk) => {
      if (settled) return;
      totalBytes += chunk.length;
      if (totalBytes > maxBytes) {
        fail(new HttpError(413, `request body exceeds ${maxBytes} bytes`, 'PAYLOAD_TOO_LARGE'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (settled) return;
      settled = true;
      const rawBody = Buffer.concat(chunks).toString('utf8');
      if (!rawBody) {
        reject(new HttpError(400, 'request body must not be empty', 'INVALID_JSON'));
        return;
      }
      try {
        resolve(JSON.parse(rawBody));
      } catch {
        reject(new HttpError(400, 'request body must contain valid JSON', 'INVALID_JSON'));
      }
    });
    req.on('aborted', () => fail(new HttpError(400, 'request was aborted', 'REQUEST_ABORTED')));
    req.on('error', fail);
  });
}

function errorResponse(error) {
  const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;
  return {
    statusCode,
    body: {
      error: statusCode >= 500 ? 'internal server error' : error.message,
      code: error.code || (statusCode >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST'),
    },
  };
}

function rejectUpgrade(socket, statusCode, statusText) {
  if (!socket.writable) return socket.destroy();
  socket.end(
    `HTTP/1.1 ${statusCode} ${statusText}\r\n` +
    'Connection: close\r\n' +
    'Content-Length: 0\r\n' +
    '\r\n'
  );
}

function parsePort(value) {
  const rawPort = String(value);
  if (!/^\d+$/.test(rawPort)) {
    throw new Error(`invalid BOBSWARM_EVENTS_PORT: ${value}`);
  }
  const port = Number(rawPort);
  if (!Number.isInteger(port) || port < 0 || port > 65_535) {
    throw new Error(`invalid BOBSWARM_EVENTS_PORT: ${value}`);
  }
  return port;
}

function startEventsServer(options = {}) {
  const port = parsePort(options.port ?? process.env.BOBSWARM_EVENTS_PORT ?? DEFAULT_PORT);
  const host = options.host ?? process.env.BOBSWARM_EVENTS_HOST ?? DEFAULT_HOST;

  const server = http.createServer(async (req, res) => {
    if (!isOriginAllowed(req)) {
      return sendJson(req, res, 403, { error: 'origin is not allowed', code: 'ORIGIN_NOT_ALLOWED' });
    }

    if (req.method === 'OPTIONS') {
      const headers = {
        ...responseHeaders(req),
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '600',
      };
      res.writeHead(204, headers);
      return res.end();
    }

    let url;
    try {
      url = new URL(req.url, `http://${host}:${port || DEFAULT_PORT}`);
    } catch {
      return sendJson(req, res, 400, { error: 'invalid request URL', code: 'INVALID_URL' });
    }
    const parts = url.pathname.split('/').filter(Boolean);

    try {
      if (req.method === 'GET' && parts.length === 1 && parts[0] === 'health') {
        return sendJson(req, res, 200, { status: 'ok', service: 'bobswarm-events' });
      }

      if (req.method === 'POST' && parts.length === 1 && parts[0] === 'runs') {
        const body = await readJsonBody(req);
        return sendJson(req, res, 201, store.createRun(body));
      }

      if (req.method === 'GET' && parts.length === 1 && parts[0] === 'runs') {
        return sendJson(req, res, 200, store.listRuns());
      }

      if (req.method === 'GET' && parts.length === 2 && parts[0] === 'runs') {
        return sendJson(req, res, 200, store.getRun(parts[1]));
      }

      if (
        req.method === 'GET' &&
        parts.length === 3 &&
        parts[0] === 'runs' &&
        parts[2] === 'report'
      ) {
        return sendJson(req, res, 200, store.getReport(parts[1]));
      }

      if (
        req.method === 'GET' &&
        parts.length === 3 &&
        parts[0] === 'runs' &&
        parts[2] === 'snapshot'
      ) {
        return sendJson(req, res, 200, store.getSnapshot(parts[1], url.searchParams.get('after') ?? 0));
      }

      return sendJson(req, res, 404, { error: 'not found', code: 'NOT_FOUND' });
    } catch (error) {
      const response = errorResponse(error);
      if (response.statusCode >= 500) {
        console.error('[BobSwarm events] request failed:', error);
      }
      return sendJson(req, res, response.statusCode, response.body);
    }
  });
  server.requestTimeout = 15_000;
  server.headersTimeout = 10_000;
  server.keepAliveTimeout = 5_000;

  const wss = new WebSocketServer({
    noServer: true,
    maxPayload: 16 * 1024,
    perMessageDeflate: false,
  });

  server.on('upgrade', (req, socket, head) => {
    if (!isOriginAllowed(req)) {
      rejectUpgrade(socket, 403, 'Forbidden');
      return;
    }

    let url;
    try {
      url = new URL(req.url, `http://${host}:${port || DEFAULT_PORT}`);
    } catch {
      rejectUpgrade(socket, 400, 'Bad Request');
      return;
    }
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length !== 3 || parts[0] !== 'runs' || parts[2] !== 'events') {
      rejectUpgrade(socket, 404, 'Not Found');
      return;
    }

    const runId = parts[1];
    const afterSequence = url.searchParams.get('after') ?? 0;
    try {
      store.getSnapshot(runId, afterSequence);
    } catch (error) {
      const { statusCode } = errorResponse(error);
      rejectUpgrade(socket, statusCode, statusCode === 404 ? 'Not Found' : 'Bad Request');
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      // Both calls are synchronous. Subscribing before taking the snapshot
      // prevents a write from being lost between replay and live delivery.
      store.subscribe(runId, ws);
      try {
        ws.send(JSON.stringify(store.getSnapshot(runId, afterSequence)));
      } catch (error) {
        store.unsubscribe(runId, ws);
        ws.close(1011, 'snapshot unavailable');
        return;
      }
      ws.on('close', () => store.unsubscribe(runId, ws));
      ws.on('error', () => store.unsubscribe(runId, ws));
    });
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(
        `[BobSwarm events] ${host}:${port} is already in use — dashboard events are unavailable, ` +
        'but MCP tools remain active. Stop the stale process or set BOBSWARM_EVENTS_PORT.'
      );
      return;
    }
    console.error('[BobSwarm events] server error (MCP tools remain active):', error.message);
  });

  server.on('close', () => {
    for (const client of wss.clients) client.terminate();
    wss.close();
  });

  server.listen(port, host, () => {
    const address = server.address();
    const boundPort = typeof address === 'object' && address ? address.port : port;
    console.error(`[BobSwarm events] listening on http://${host}:${boundPort}`);
  });

  return server;
}

module.exports = {
  HttpError,
  MAX_BODY_BYTES,
  readJsonBody,
  startEventsServer,
};

if (require.main === module) {
  startEventsServer();
}
