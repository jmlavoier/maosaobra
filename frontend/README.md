# maosaobra — Frontend

Single-file vanilla HTML + CSS + JavaScript app.  No build step, no framework, no bundler.

## How it works

1. On page load, two `fetch()` calls are made in parallel:
   - `GET /api/project` — project name, address, worker name
   - `GET /api/services` — all service items grouped by category

2. The UI is rendered entirely from JavaScript via `innerHTML` (XSS-safe — all user-visible strings pass through `escHtml`).

3. Clicking a service item sends:
   ```
   PATCH /api/services/:id   { "done": true | false }
   ```
   On success the in-memory state is updated and the UI re-renders.  No full page reload.

4. The header card shows real-time totals (overall progress %, tasks done, budget breakdown) derived from local state.

## API base URL

All API calls use relative paths (`/api/…`).  In Docker, nginx forwards those to the backend container.  When opening the file directly in a browser (file://) the calls will fail — you need a local server that proxies `/api/` to `http://localhost:3000`.

## Updating content / seeding new data

All data lives in the SQLite database.  To change project details or service descriptions:

1. Edit the seed array in `backend/db/init.js`.
2. Delete (or reset) the SQLite file at `DB_PATH`.
3. Restart the backend — it will re-seed on first run.

There is no admin UI; data updates are done directly via the API or by re-seeding.
