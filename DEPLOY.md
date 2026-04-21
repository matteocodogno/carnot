# Deploy guide — carnot demo (Vercel + Railway)

**Stack:** React/Vite frontend on Vercel · Hono/Node backend on Railway  
**Estimated time:** ~20 minutes

---

## Prerequisites

- GitHub account (repo can be private)
- [Vercel account](https://vercel.com) — free Hobby plan is fine
- [Railway account](https://railway.app) — free Trial plan is fine (500 h/month)
- Node 18+ installed locally

---

## Step 1 — Push to GitHub

From the root of your local `demo/` folder (or a parent repo):

```bash
cd /path/to/ticinoenergia          # wherever the demo/ folder lives
git init                           # skip if already a git repo
git add demo/
git commit -m "feat: carnot demo initial commit"
git remote add origin https://github.com/<your-org>/carnot.git
git push -u origin main
```

> **Monorepo note.** The repo can contain both `demo/backend/` and
> `demo/frontend/` — you'll tell Railway and Vercel which sub-folder to use.

---

## Step 2 — Deploy the backend on Railway

### 2a. Create a new project

1. Go to [railway.app/new](https://railway.app/new)
2. Choose **"Deploy from GitHub repo"**
3. Select your `carnot` repository
4. Railway auto-detects Node.js — click **Deploy**

### 2b. Set the root directory

1. Open your service → **Settings** tab
2. Under **Source** → **Root Directory**, enter: `demo/backend`
3. Click **Save** — Railway will rebuild automatically

### 2c. Verify build & start commands

Railway reads `railway.toml` automatically. Confirm in **Settings → Deploy**:

| Field | Value |
|---|---|
| Build command | `npm install` |
| Start command | `npm run start` |

### 2d. Add environment variables

In your service → **Variables** tab, add:

| Key | Value |
|---|---|
| `FRONTEND_URL` | *(leave blank for now — you'll fill this in Step 4)* |

> `PORT` is injected automatically by Railway — do **not** set it manually.

### 2e. Get your backend URL

Once the deploy goes green, open the service → **Settings → Networking** →
click **Generate Domain**.

Copy the URL — it looks like:  
`https://carnot-backend-production.up.railway.app`

Save it, you'll need it in the next step.

---

## Step 3 — Deploy the frontend on Vercel

### 3a. Import the project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"** and select your `carnot` repo
3. **Framework preset:** Vite (Vercel detects this automatically)

### 3b. Set the root directory

In the import dialog, expand **"Root Directory"** and enter:

```
demo/frontend
```

### 3c. Add the environment variable

Still in the import dialog, expand **"Environment Variables"** and add:

| Name | Value |
|---|---|
| `VITE_API_URL` | `https://carnot-backend-production.up.railway.app` ← your Railway URL from Step 2e |

> Make sure there is **no trailing slash** at the end of the URL.

### 3d. Deploy

Click **Deploy**. Vercel will run `npm install && npm run build` and serve
the `dist/` folder.

Once it's done, copy your Vercel URL — it looks like:  
`https://carnot-demo.vercel.app`

---

## Step 4 — Wire the frontend URL into the backend

Now that you have the Vercel URL, go back to Railway:

1. Open your backend service → **Variables** tab
2. Set `FRONTEND_URL` = `https://carnot-demo.vercel.app` ← your Vercel URL
3. Click **Save** — Railway redeploys automatically (takes ~30 s)

This unlocks CORS for your Vercel domain so the browser can talk to the backend.

---

## Step 5 — Smoke test

Open your Vercel URL and run through the full flow:

- [ ] Landing page loads
- [ ] Questionnaire: complete all 6 steps → submit
- [ ] Preview results page shows pathways (top 2 visible, rest locked)
- [ ] Click "Crea account gratuito" → registration form
- [ ] Register → redirects to Dashboard
- [ ] Dashboard loads with your data (Panoramica, Dossier, Percorsi, Consulente)
- [ ] Logout → redirects to home

If any step fails, check the browser console (F12) and the Railway logs
(**Deployments → latest → View Logs**).

---

## Updating the demo after code changes

```bash
git add demo/
git commit -m "fix: ..."
git push
```

Both Vercel and Railway listen to `main` pushes and redeploy automatically.

---

## Common issues

| Symptom | Likely cause | Fix |
|---|---|---|
| CORS error in browser console | `FRONTEND_URL` not set or mismatched | Check Step 4 |
| Blank page after deploy | SPA routes not rewriting | Check `vercel.json` is at `demo/frontend/vercel.json` |
| Backend returns 502 | Start command failed | Check Railway logs; ensure `npm run start` works locally |
| `VITE_API_URL` is undefined at runtime | Env var not set in Vercel | Add it in Vercel → Project → Settings → Environment Variables, then redeploy |
| Preview pathways empty | Old code without `pathwaysBlurred` inside `preview` | Ensure you've pushed the latest `backend/src/index.ts` |
