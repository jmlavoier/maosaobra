'use strict';
const http = require('http');
const { handleSignup, handleSignin } = require('./routes/auth');
const { handleList, handleGet }      = require('./routes/project');
const { handleGetAll, handlePatch }  = require('./routes/services');
const { withAuth }                   = require('./middleware/auth');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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

    // ── Auth (unprotected) ───────────────────────────────────────────────
    if (req.method === 'POST' && req.url === '/api/auth/signup') {
      return handleSignup(req, res);
    }
    if (req.method === 'POST' && req.url === '/api/auth/signin') {
      return handleSignin(req, res);
    }

    // ── Projects (protected) ─────────────────────────────────────────────
    if (req.method === 'GET' && req.url === '/api/projects') {
      return withAuth(handleList)(req, res);
    }

    const projectMatch = req.url.match(/^\/api\/projects\/(\d+)$/);
    if (req.method === 'GET' && projectMatch) {
      return withAuth(handleGet)(req, res, parseInt(projectMatch[1], 10));
    }

    // ── Services (protected) ─────────────────────────────────────────────
    const svcGetMatch = req.url.match(/^\/api\/projects\/(\d+)\/services$/);
    if (req.method === 'GET' && svcGetMatch) {
      return withAuth(handleGetAll)(req, res, parseInt(svcGetMatch[1], 10));
    }

    const svcPatchMatch = req.url.match(/^\/api\/services\/(\d+)$/);
    if (req.method === 'PATCH' && svcPatchMatch) {
      return withAuth(handlePatch)(req, res, parseInt(svcPatchMatch[1], 10));
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  });
});

server.listen(PORT, () => {
  console.log(`maosaobra backend listening on :${PORT}`);
});
