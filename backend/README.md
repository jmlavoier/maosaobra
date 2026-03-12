# maosaobra — Backend API

Plain Node.js HTTP server (no framework) backed by SQLite via `better-sqlite3`.

## Entry point

```
backend/
  server.js        HTTP server, routing
  routes/
    project.js     GET /api/project
    services.js    GET /api/services  |  PATCH /api/services/:id
  db/
    init.js        DB schema creation + first-run seed
```

## API reference

### GET /api/project

Returns the current project record.

**Response 200**
```json
{
  "id": 1,
  "name": "Reforma Residencial",
  "address": "R. Olga Rossi Fabbri, 221 — Brodowski/SP",
  "worker_name": "Wellington Pedreiro"
}
```

---

### GET /api/services

Returns all services grouped by category, ordered by id.

**Response 200**
```json
[
  {
    "category": "Pacote A — Mão de Obra Geral",
    "total_value": 11500,
    "items": [
      {
        "id": 1,
        "description": "Retirada total de pisos e azulejos dos 2 banheiros",
        "done": false,
        "value": 884.6153846153846
      }
    ]
  },
  {
    "category": "Pacote B — Banheiros (Acabamentos)",
    "total_value": 4250,
    "items": [ ... ]
  },
  {
    "category": "Extras — Serviços Adicionais",
    "total_value": 3500,
    "items": [ ... ]
  }
]
```

---

### PATCH /api/services/:id

Updates the `done` field of a single service item.

**Request body**
```json
{ "done": true }
```

**Response 200** — updated service
```json
{
  "id": 1,
  "description": "Retirada total de pisos e azulejos dos 2 banheiros",
  "category": "Pacote A — Mão de Obra Geral",
  "done": true,
  "value": 884.6153846153846
}
```

**Error responses**

| Status | Body                              | Cause                    |
|--------|-----------------------------------|--------------------------|
| 400    | `{"error":"` done ` must be a boolean"}` | Missing or wrong type    |
| 404    | `{"error":"Service not found"}`   | Unknown id               |

---

## Running locally

```bash
npm install
npm run dev     # nodemon — restarts on file changes
# or
npm start       # plain node
```

The SQLite file is created at `DB_PATH` (default: `../data/maosaobra.db`).
