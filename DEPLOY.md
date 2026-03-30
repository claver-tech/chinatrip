# 🚀 Deploying China Trip Planner to the Cloud

**Total time: ~15 minutes**
**Cost: Free** (Railway free tier + Vercel free tier)
**Result: A URL you and Joanna can open on any phone or computer**

---

## Step 1 — Push to GitHub (5 min)

1. Go to https://github.com and create a free account if you don't have one
2. Click **New Repository** → name it `chinatrip` → **Public** → **Create**
3. Open a CMD window in `C:\Claude Projects\chinatrip\` and run:

```
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/chinatrip.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## Step 2 — Deploy Backend on Railway (5 min)

1. Go to https://railway.app → sign in with GitHub
2. Click **New Project** → **Deploy from GitHub repo** → select `chinatrip`
3. Railway will detect the backend. Set the **Root Directory** to `backend`
4. Click **Add Database** → **PostgreSQL** → Railway auto-links it
5. Under **Variables**, add:
   ```
   PORT=8000
   ```
6. Railway gives you a URL like `https://chinatrip-production.up.railway.app`
   **Copy this URL** — you'll need it for Step 3

---

## Step 3 — Deploy Frontend on Vercel (5 min)

1. Go to https://vercel.com → sign in with GitHub
2. Click **Add New Project** → select `chinatrip`
3. Set **Root Directory** to `frontend`
4. Under **Environment Variables**, add:
   ```
   VITE_API_URL = https://YOUR-RAILWAY-URL-HERE
   ```
   (paste the Railway URL from Step 2)
5. Click **Deploy**
6. Vercel gives you a URL like `https://chinatrip.vercel.app`

---

## Step 4 — Open on your phone! 📱

Open `https://chinatrip.vercel.app` on any device.
Bookmark it on your home screen for app-like access.

**iOS:** Safari → Share → Add to Home Screen
**Android:** Chrome → Menu → Add to Home Screen

---

## Your data

- All edits save to the Railway PostgreSQL database
- Both you and Joanna see the same data in real time
- The app re-seeds automatically on first cloud launch

---

## Updating the app

After making changes locally, just push to GitHub:
```
git add .
git commit -m "Update"
git push
```
Both Railway and Vercel auto-redeploy within 1-2 minutes.
