'use strict';
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../../data/maosaobra.db');

const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(DB_PATH);

// ── Core tables ────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS projects (
    id          INTEGER PRIMARY KEY,
    name        TEXT NOT NULL,
    address     TEXT,
    worker_name TEXT
  );

  CREATE TABLE IF NOT EXISTS services (
    id          INTEGER PRIMARY KEY,
    project_id  INTEGER REFERENCES projects(id),
    description TEXT NOT NULL,
    category    TEXT NOT NULL,
    done        INTEGER DEFAULT 0,
    value       REAL    DEFAULT 0
  );
`);

// ── Migration: add user_id to projects if missing ─────────────────────────

const projectsCols = db.pragma('table_info(projects)').map(c => c.name);
if (!projectsCols.includes('user_id')) {
  db.exec('ALTER TABLE projects ADD COLUMN user_id INTEGER REFERENCES users(id)');
}

// ── Seed ───────────────────────────────────────────────────────────────────

const { c } = db.prepare('SELECT COUNT(*) AS c FROM projects').get();
if (c === 0) {
  db.prepare(
    'INSERT INTO projects (id, name, address, worker_name) VALUES (?, ?, ?, ?)'
  ).run(
    1,
    'Reforma Residencial',
    'R. Olga Rossi Fabbri, 221 — Brodowski/SP',
    'Wellington Pedreiro'
  );

  const ins = db.prepare(
    'INSERT INTO services (id, project_id, description, category, done, value) VALUES (?, 1, ?, ?, 0, ?)'
  );

  const A = 'Pacote A — Mão de Obra Geral';
  const B = 'Pacote B — Banheiros (Acabamentos)';
  const E = 'Extras — Serviços Adicionais';

  const seed = [
    // Pacote A — 13 items, total R$ 11 500
    [1,  'Retirada total de pisos e azulejos dos 2 banheiros',              A, 11500 / 13],
    [2,  'Impermeabilização de ambos os banheiros',                          A, 11500 / 13],
    [3,  'Retirada de todos os rodapés da casa',                             A, 11500 / 13],
    [4,  'Solução de infiltração de rodapé de parede com Block total',       A, 11500 / 13],
    [5,  'Fechamento de parede na lavanderia',                               A, 11500 / 13],
    [6,  'Retirada de reboco danificado com trincas',                        A, 11500 / 13],
    [7,  'Instalação de tela e novo reboco',                                 A, 11500 / 13],
    [8,  'Retirada de calçada',                                              A, 11500 / 13],
    [9,  'Descarte de entulho em caçamba',                                   A, 11500 / 13],
    [10, 'Malha de ferro e nova concretagem da calçada',                     A, 11500 / 13],
    [11, 'Retirada de rejunte antigo do corredor',                           A, 11500 / 13],
    [12, 'Rejuntar corredor novamente',                                       A, 11500 / 13],
    [13, 'Pintura de parede externa com tinta emborrachada',                 A, 11500 / 13],

    // Pacote B — 5 items, total R$ 4 250
    [14, 'Execução de dois nichos (um em cada banheiro, no próprio azulejo)', B, 4250 / 5],
    [15, 'Mudança de encanamento de esgoto e água de ambos os banheiros',    B, 4250 / 5],
    [16, 'Fornecimento de vasos sanitários e pias novos',                     B, 4250 / 5],
    [17, 'Instalação de vasos sanitários e pias',                             B, 4250 / 5],
    [18, 'Retirada dos armários de espelhos',                                 B, 4250 / 5],

    // Extras — 10 items, total R$ 3 500
    [19, 'Retirada do reboco banheiro social por completo',                   E, 3500 / 10],
    [20, 'Reboco do banheiro social por completo',                            E, 3500 / 10],
    [21, 'Aumento do nicho — tamanho fora do padrão',                        E, 3500 / 10],
    [22, 'Corte do chão',                                                     E, 3500 / 10],
    [23, 'Aumento do box e cimentado',                                        E, 3500 / 10],
    [24, 'Restauração das paredes danificadas banheiro suíte',                E, 3500 / 10],
    [25, 'Remoção da porta de vidro',                                         E, 3500 / 10],
    [26, 'Troca de todos os reparos dos registros',                           E, 3500 / 10],
    [27, "Instalação de registro caixa d'água",                               E, 3500 / 10],
    [28, 'Instalação de pontos elétricos para espelhos (ambos os banheiros)', E, 3500 / 10],
  ];

  const seedAll = db.transaction((rows) => {
    for (const [id, desc, cat, val] of rows) ins.run(id, desc, cat, val);
  });
  seedAll(seed);

  console.log('Database seeded with project and 28 services.');
}

module.exports = db;
