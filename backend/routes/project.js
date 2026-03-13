'use strict';
const db = require('../db/init');

function handleList(req, res) {
  const projects = db.prepare(
    'SELECT id, name, address, worker_name FROM projects WHERE user_id = ? ORDER BY id'
  ).all(req.user.userId);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(projects));
}

function handleGet(req, res, id) {
  const project = db.prepare(
    'SELECT id, name, address, worker_name FROM projects WHERE id = ? AND user_id = ?'
  ).get(id, req.user.userId);

  if (!project) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Project not found' }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(project));
}

module.exports = { handleList, handleGet };
