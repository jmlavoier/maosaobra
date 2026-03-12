'use strict';
const db = require('../db/init');

function handle(req, res) {
  const project = db.prepare('SELECT * FROM projects WHERE id = 1').get();
  if (!project) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Project not found' }));
    return;
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(project));
}

module.exports = { handle };
