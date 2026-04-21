# arCO₂ — Module 1 Private Individuals Demo

**Codename: carnot**

A fully functional demo of Module 1 (Initial Contact & Orientation) of the arCO₂ platform, built by WellD for the TicinoEnergia RFP.

## Tech stack

| Layer | Technologies |
|---|---|
| Frontend | React 18 + Vite 5 + TypeScript + React Router v6 |
| Backend | Node.js + Hono v4 + TypeScript |
| Data | In-memory store (demo) — ready to swap for Postgres/SQLite in production |
| Deploy | Frontend → Vercel · Backend → Railway |

## Quick start

### 1. Backend (port 3001)

```bash
cd backend
npm install
npm run dev
```

### 2. Frontend (port 5173)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## User flow

```
Landing page
    ↓  "Discover pathways for your building"
Questionnaire (6 steps)
    ↓  user answers 6 questions
Preview results (top 2 visible · rest locked)
    ↓  "Create free account"
Registration
    ↓  account created, questionnaire data linked
Dashboard
    ├── Overview (stats, top pathway, next steps)
    ├── Building dossier (data + completion progress)
    ├── Pathways (5 pathways with expandable details)
    ├── Assigned arCO₂ consultant
    └── Documents
```

## API endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/questionnaire` | Submit questionnaire → run pathway scoring algorithm |
| POST | `/api/register` | Create account (links questionnaire data via tempToken) |
| POST | `/api/login` | Login for existing users |
| GET | `/api/dashboard` | Dashboard data (requires Bearer token) |

## Recommendation algorithm

The backend scores 5 possible pathways based on the 6 questionnaire answers:

1. **Building envelope retrofit** — insulation + windows
2. **Heating system replacement** — heat pump
3. **Photovoltaic + storage** — solar panels + battery
4. **Mechanical ventilation** — controlled ventilation system
5. **CECE energy certification** — official energy certificate

Pathways are ranked by score and labelled: *Strongly recommended*, *Recommended*, *Worth considering*, *Optional*.

Estimation functions (`ageFactor`, `fuelFactor`, `classeFactor`) derive savings ranges, CO₂ reductions, and incentive amounts deterministically from the user's actual answers — no randomness, no hardcoded values.

## Deployment

See [DEPLOY.md](./DEPLOY.md) for the full step-by-step guide (GitHub → Railway → Vercel).

**Environment variables summary:**

| Service | Variable | Description |
|---|---|---|
| Backend (Railway) | `FRONTEND_URL` | Vercel URL, e.g. `https://carnot-demo.vercel.app` |
| Frontend (Vercel) | `VITE_API_URL` | Railway URL, e.g. `https://carnot-backend.up.railway.app` |

## Demo notes

- The demo uses **in-memory storage** — data resets on server restart (intentional for demo simplicity)
- The Vite dev proxy (`/api → localhost:3001`) handles CORS in development automatically
- TypeScript compiles without errors on both projects
- 3 mock arCO₂ consultants, assigned round-robin at registration

---

*Demo built by WellD for the arCO₂ RFP · TicinoEnergia · April 2026*
