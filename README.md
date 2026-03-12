# maosaobra

Tracks construction / renovation service progress for a residential project.

## Folder structure

```
maosaobra/
  backend/            Node.js API + SQLite
  frontend/           Single-page vanilla HTML app
  data/               SQLite database file (created on first run, gitignored)
  docker-compose.yml          Production stack
  docker-compose.dev.yml      Development stack (live-reload)
```

## Environment variables

| Variable   | Default                    | Description                        |
|------------|----------------------------|------------------------------------|
| `PORT`     | `3000`                     | Port the backend listens on        |
| `DB_PATH`  | `./data/maosaobra.db`      | Absolute path to the SQLite file   |

## Running in development (Docker)

```bash
docker compose -f docker-compose.dev.yml up --build
```

- Frontend: http://localhost
- Backend API: http://localhost:3000

Source files are mounted as volumes — edit `frontend/index.html` or any backend file and changes are reflected immediately (backend restarts via nodemon).

## Running in production (Docker)

```bash
docker compose up --build -d
```

Same ports as dev. The SQLite database is persisted in the named volume `sqlite_data`.

## Running without Docker

```bash
# Backend
cd backend
npm install
node server.js        # or: npm run dev  (uses nodemon)

# Frontend (served via any static file server or opened directly in a browser)
# When running without Docker, the frontend JS calls /api/* which will be
# resolved relative to whatever server is hosting index.html.
# The simplest setup: open frontend/index.html via a local server that
# proxies /api/* to http://localhost:3000.
```

## Database

SQLite is used via `better-sqlite3`.  The file is created automatically at `DB_PATH` on first run, and seeded with project + service data from the original checklist.

To reset the database, delete the file at `DB_PATH` and restart the backend.
