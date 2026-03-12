'use strict';
const http = require('http');
const { handle: handleProject }       = require('./routes/project');
const { handleGetAll, handlePatch }   = require('./routes/services');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let raw = '';
  req.on('data', chunk => { raw += chunk; });
  req.on('end', () => {
    req.body = {};
    if (raw) {
      try { req.body = JSON.parse(raw); } catch { /* ignore malformed JSON */ }
    }

    if (req.method === 'GET' && req.url === '/api/project') {
      return handleProject(req, res);
    }

    if (req.method === 'GET' && req.url === '/api/services') {
      return handleGetAll(req, res);
    }

    const patch = req.url.match(/^\/api\/services\/(\d+)$/);
    if (req.method === 'PATCH' && patch) {
      return handlePatch(req, res, parseInt(patch[1], 10));
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  });
});

server.listen(PORT, () => {
  console.log(`maosaobra backend listening on :${PORT}`);
});
