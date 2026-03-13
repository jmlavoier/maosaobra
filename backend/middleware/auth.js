'use strict';
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

/**
 * Wraps a route handler with JWT authentication.
 * Reads the `Authorization: Bearer <token>` header, verifies the token,
 * attaches `req.user` (payload), then calls the original handler.
 * Sends 401 if the header is missing or the token is invalid/expired.
 */
function withAuth(handler) {
  return function (req, res, ...args) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    const token = authHeader.slice(7);
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      return handler(req, res, ...args);
    } catch {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid or expired token' }));
    }
  };
}

module.exports = { withAuth };
