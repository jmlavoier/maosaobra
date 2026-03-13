'use strict';
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../db/init');

const JWT_SECRET  = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES = '24h';

function handleSignup(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'name, email and password are required' }));
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid email format' }));
    return;
  }

  if (password.length < 8) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Password must be at least 8 characters' }));
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    res.writeHead(409, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Email already registered' }));
    return;
  }

  const password_hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)'
  ).run(name.trim(), normalizedEmail, password_hash);

  const userId = result.lastInsertRowid;

  // Assign any unowned projects to this user (covers the seeded project on first signup)
  db.prepare('UPDATE projects SET user_id = ? WHERE user_id IS NULL').run(userId);

  const token = jwt.sign(
    { userId, email: normalizedEmail, name: name.trim() },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );

  res.writeHead(201, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    token,
    user: { id: userId, name: name.trim(), email: normalizedEmail },
  }));
}

function handleSignin(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'email and password are required' }));
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid credentials' }));
    return;
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    token,
    user: { id: user.id, name: user.name, email: user.email },
  }));
}

module.exports = { handleSignup, handleSignin };
