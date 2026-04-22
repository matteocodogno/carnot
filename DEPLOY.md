# arCO₂ demo — Railway deployment guide

> Codename **carnot** · Last updated 2026-04-22

---

## Prerequisites

- [Railway](https://railway.app) account
- Railway CLI installed: `npm install -g @railway/cli` and `railway login`
- The `demo/` folder pushed to a GitHub repo (or deploy directly from the CLI)

---

## 1 — Create the Railway project

1. In the Railway dashboard click **New Project → Deploy from GitHub repo** and select the `carnot` repo.
2. Railway auto-detects two services (frontend + backend). If it doesn't, add them manually:
    - **backend** → root directory `demo/backend`, start command `npm start`
    - **frontend** → root directory `demo/frontend`, build command `npm run build`, publish directory `dist`

---

## 2 — Add Postgres

1. Inside the Railway project click **+ New → Database → Add PostgreSQL**.
2. Railway creates a Postgres instance and automatically injects `DATABASE_URL` into every service in the project.
3. No further configuration is needed — `db.ts` reads `process.env.DATABASE_URL` and `initDb()` creates the tables on first boot.

---

## 3 — Set environment variables (backend service)

Go to your **backend** service → **Variables** tab and add:

| Variable | Value | Notes |
|---|---|---|
| `NODE_ENV` | `production` | Enables SSL for Postgres |
| `FRONTEND_URL` | `https://your-frontend.up.railway.app` | Copy from frontend service domain |
| `SEED_SECRET` | *(any secret string)* | Protects the `/api/seed` endpoint |

`DATABASE_URL` and `PORT` are already injected by Railway — do **not** add them manually.

---

## 4 — Set environment variables (frontend service)

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://your-backend.up.railway.app` |

---

## 5 — Deploy

```bash
# From the repo root, or just push to main — Railway redeploys automatically.
git push origin main
```

Watch the build logs in the Railway dashboard. On successful start you should see:

```
Database schema ready
Server running on port XXXX
```

---

## 6 — Seed demo data

After the first deploy, populate the database with 10 realistic demo users:

```bash
curl -X POST https://your-backend.up.railway.app/api/seed \
  -H "X-Seed-Secret: YOUR_SEED_SECRET"
```

Expected response:

```json
{ "seeded": 10 }
```

This endpoint **wipes all existing users** and re-inserts the seed data. Run it any time you want to reset the demo to a clean state (e.g. before the TicinoEnergia presentation).

### Seed users at a glance

All users have password **`demo123`** and email format `nome.cognome@example.com`.

| Status | Count |
|---|---|
| `new` | 1 |
| `questionnaire_done` | 3 |
| `consultant_assigned` | 2 |
| `in_progress` | 2 |
| `completed` | 2 |

---

## 7 — Admin login

The admin panel is at `/admin`.

Default admin credentials (hardcoded in `index.ts`, change before going to production):

| Field | Value |
|---|---|
| Username | `admin` |
| Password | `ticino2025` |

---

## 8 — Local development with a real DB

1. Copy the env example: `cp demo/backend/.env.example demo/backend/.env`
2. Fill in `DATABASE_URL` with your local Postgres connection string.
3. Set `SEED_SECRET` to anything (e.g. `dev`).
4. Start the backend: `cd demo/backend && npm run dev`
5. Start the frontend: `cd demo/frontend && npm run dev`
6. Seed: `curl -X POST http://localhost:3001/api/seed -H "X-Seed-Secret: dev"`

---

## Resetting the demo before a presentation

```bash
# Replace URL and secret with your actual values
curl -X POST https://your-backend.up.railway.app/api/seed \
  -H "X-Seed-Secret: YOUR_SEED_SECRET"
```

This takes ~1 second and leaves the DB in a clean, predictable state for the demo walk-through.