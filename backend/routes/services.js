'use strict';
const db = require('../db/init');

function handleGetAll(req, res, projectId) {
  // Verify the project belongs to the authenticated user
  const project = db.prepare(
    'SELECT id FROM projects WHERE id = ? AND user_id = ?'
  ).get(projectId, req.user.userId);

  if (!project) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Project not found' }));
    return;
  }

  const rows = db.prepare(
    'SELECT id, description, category, done, value FROM services WHERE project_id = ? ORDER BY id'
  ).all(projectId);

  // Group by category preserving insertion order
  const map = new Map();
  for (const row of rows) {
    if (!map.has(row.category)) {
      map.set(row.category, { category: row.category, total_value: 0, items: [] });
    }
    const group = map.get(row.category);
    group.items.push({
      id: row.id,
      description: row.description,
      done: row.done === 1,
      value: row.value,
    });
    group.total_value += row.value;
  }

  const result = [];
  for (const group of map.values()) {
    group.total_value = Math.round(group.total_value * 100) / 100;
    result.push(group);
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(result));
}

function handlePatch(req, res, id) {
  const { done } = req.body;
  if (typeof done !== 'boolean') {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '`done` must be a boolean' }));
    return;
  }

  // Verify the service belongs to a project owned by the authenticated user
  const owned = db.prepare(
    `SELECT s.id FROM services s
     JOIN projects p ON p.id = s.project_id
     WHERE s.id = ? AND p.user_id = ?`
  ).get(id, req.user.userId);

  if (!owned) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Service not found' }));
    return;
  }

  db.prepare('UPDATE services SET done = ? WHERE id = ?').run(done ? 1 : 0, id);

  const service = db.prepare(
    'SELECT id, description, category, done, value FROM services WHERE id = ?'
  ).get(id);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ...service, done: service.done === 1 }));
}

module.exports = { handleGetAll, handlePatch };
