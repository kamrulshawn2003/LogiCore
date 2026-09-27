# LogiCore Deployment Guide

Deploy LogiCore in three pieces:

| Piece | Service | What it runs |
|---|---|---|
| Database | **Aiven** (MySQL) | The MySQL database |
| Backend API | **Render** | Express + Sequelize API on port 5000 |
| Frontend | **Vercel** | Vite/React store (SPA) |

All configuration is environment-variable driven — **no secrets live in the repository**.

---

## 0. Before you start

- The repo is already connected to GitHub: `https://github.com/kamrulshawn2003/LogiCore` (branch `main`).
- Push the latest code first (see Step 1). If GitHub is unreachable from your network, use a VPN/proxy or the SSH remote:
  `git remote set-url origin git@github.com:kamrulshawn2003/LogiCore.git`

---

## 1. Push the project to GitHub

```bash
cd "C:\Users\ARAKSUKI\Desktop\web desigining\practices\.vscode\website\LogiCore"
git add -A
git commit -m "Deployment ready: env-driven config, db sync + demo seeds, CORS multi-origin"
git push origin main
```

---

## 2. Aiven — MySQL database

1. Go to https://console.aiven.io and create/log in to an account.
2. **Create a new service** → choose **MySQL**.
   - Pick the free tier if available in your region, otherwise the smallest paid plan.
   - Choose a cloud/region (e.g. `google-europe-west1` or closest to your Render region).
   - Service name: `logicore-db`.
3. Wait for the service to reach **Running** (a few minutes).
4. Open the service page and copy the connection details under **Connection information** (or **Overview → Service URI**):
   - Host (e.g. `logicore-db-xxxx.aivencloud.com`)
   - Port (e.g. `24019`)
   - Database name (e.g. `defaultdb`) — or create your own DB via the Aiven CLI/console
   - User (e.g. `avnadmin`)
   - Password
5. Note: Aiven requires **SSL/TLS**. The backend already connects with `ssl: { require: true, rejectUnauthorized: false }` in production, so nothing extra is needed.
6. The tables are **not** created yet — you will create them in Step 3 (Render Shell).

---

## 3. Render — backend API

1. Go to https://dashboard.render.com → **New** → **Blueprint** (imports `render.yaml`, optional) **or** **New** → **Web Service**.
2. If using **Web Service** (recommended for full control):
   - Connect your GitHub repo `kamrulshawn2003/LogiCore`.
   - **Name**: `logicore-api`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (note: free instances sleep after inactivity)
   - **Health Check Path**: `/health`
3. **Environment variables** (set all of these):

   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` (Render sets this automatically) |
   | `DB_HOST` | Aiven Host |
   | `DB_PORT` | Aiven Port |
   | `DB_NAME` | Aiven database name |
   | `DB_USER` | Aiven user |
   | `DB_PASSWORD` | Aiven password |
   | `JWT_SECRET` | a long random string (e.g. generated with `openssl rand -hex 32`) |
   | `JWT_EXPIRE` | `24h` |
   | `CORS_ORIGIN` | your Vercel URL, e.g. `https://logicore.vercel.app` (or keep the local dev origin too, comma-separated: `http://localhost:5173,https://logicore.vercel.app`) |
   | `RATE_LIMIT_WINDOW_MS` | `900000` |
   | `RATE_LIMIT_MAX` | `1000` |
4. **Deploy**. When the service is **Live**, open **Shell** (top-right) and run these ONE-TIME setup commands:

   ```bash
   npm run db:sync        # creates all tables
   npm run seed:store     # seeds the JD-style product catalog + inventory
   npm run seed:demo      # creates demo users (password: Password123!)
   ```

   > Run `db:sync` only once on a fresh database. It creates every table from
   > the Sequelize models, including the newest ones (carts, reviews,
   > wishlists, refunds, product images).
5. Verify the API is live: open `https://<your-service>.onrender.com/health` → `{"status":"ok"}`.

---

## 4. Vercel — frontend

1. Go to https://vercel.com → **Add New** → **Project** → import `kamrulshawn2003/LogiCore`.
2. **Root Directory**: `frontend`
3. Framework preset: **Vite** (auto-detected). Vercel will run:
   - Build: `npm run build` → output: `dist`
   - `vercel.json` in the repo root already rewrites all routes to `index.html` (SPA routing works — refreshing `/store` won't 404).
4. **Environment Variables** (add in the Project → Settings → Environment Variables):

   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://<your-render-service>.onrender.com/api/v1` |

5. **Deploy**. Production domain looks like `https://logicore.vercel.app` (custom domain supported later).

---

## 5. After deployment — checklist

- [ ] `https://<render>.onrender.com/health` returns `{"status":"ok"}`
- [ ] Open the Vercel URL — the store (customer page) loads, images visible
- [ ] Login as each demo account (all passwords `Password123!`):
  - `admin@logicore.com` → dashboard
  - `manager@logicore.com` → dashboard
  - `supplier@logicore.com` → purchase orders
  - `driver@logicore.com` → shipments
  - `customer@logicore.com` → store / orders
- [ ] Add a product to cart, place an order as customer; check it appears in admin dashboard
- [ ] Test refund/return request on a delivered order; approve it in admin → Refunds & Returns
- [ ] `CORS_ORIGIN` matches the Vercel domain exactly (no trailing slash)

---

## 6. Troubleshooting

| Symptom | Cause / Fix |
|---|---|
| Backend logs `ECONNREFUSED` to DB | Wrong Aiven host/port, or Aiven still starting. Check env vars. |
| Backend logs `ER_ACCESS_DENIED_ERROR` | Wrong `DB_USER` / `DB_PASSWORD`. |
| Backend logs SSL error | Aiven requires TLS; production config already uses `ssl.require=true`. |
| Frontend API calls fail with CORS error | `CORS_ORIGIN` on Render does not include your Vercel domain. Set it to the exact domain. |
| Refresh of a deep link 404s on Vercel | `vercel.json` should be at repo ROOT with `routes: [{ "src": "/(.*)", "dest": "/index.html" }]`. |
| Free Render instance slow on first hit | Free tier sleeps; first request after idle takes a few seconds to wake. |
| `npm run db:sync` re-created duplicate indexes | Only run sync once on a fresh DB; never re-run it on an existing database. |
| `sequelize-cli` cannot find config | It uses `.sequelizerc` → `config/env-config.js` (env-driven, secrets never committed). |

---

## 7. Security notes

- **Never commit `.env` files** (they are gitignored). Use the platform env-var editors instead.
- **Rotate your local MySQL password**: the old `backend/config/config.json` (removed in the latest commit) contained the real dev database password and was part of the repo's first commit, so treat it as potentially exposed. Change the password in `backend/.env` and your local MySQL if it matters to you.
- Backend production already enables Helmet security headers, CORS restriction, and rate limiting.
