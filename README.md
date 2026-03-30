# 🏮 China Trip Planner 2026 — Local Setup Guide

## What This Is
A full web app with:
- **React frontend** (runs at http://localhost:5173)
- **FastAPI backend** with SQLite database (runs at http://localhost:8000)
- **Mapbox GL** real interactive map with your API key
- **Persistent storage** — all edits save to a local database file (`backend/chinatrip.db`)

---

## Prerequisites

| Tool | Check | Install |
|------|-------|---------|
| Node.js | `node -v` in terminal | https://nodejs.org (LTS version) |
| Python 3.10+ | `python --version` | https://python.org |

You said you already have Node.js — just make sure Python is installed too.

---

## First-Time Setup & Start (Windows)

**Option A — Double-click (easiest):**
```
Double-click start.bat
```
It will install all dependencies, start both servers, and open your browser automatically.

**Option B — Manual (two terminal windows):**

Terminal 1 — Backend:
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

Terminal 2 — Frontend:
```bash
cd frontend
npm install
npm run dev
```

Then open: **http://localhost:5173**

---

## First Launch

On first launch, the app automatically seeds the database with your full itinerary (all 37 days, 13 hotels, 18 transport legs, finance categories). This only happens once.

---

## How the App Works

| Feature | How to use |
|---------|-----------|
| **Edit any field** | Click any text field and type — saves automatically on blur |
| **Reorder days** | Drag the ⠿ handle on any day card |
| **CAD ↔ CNY** | Toggle in the top nav bar — converts all costs instantly |
| **Exchange rate** | Click the rate display (e.g. "1 CAD = 5.03 ¥") to update it |
| **Map** | Click any route line for leg info · Click city markers for hotel info |
| **Add/Delete** | Every section has + Add and 🗑 Delete buttons |

---

## Files

```
chinatrip/
├── start.bat              ← Double-click to start everything (Windows)
├── backend/
│   ├── main.py            ← FastAPI app + all API endpoints
│   ├── seed_data.py       ← Your full trip data
│   ├── requirements.txt   ← Python dependencies
│   └── chinatrip.db       ← SQLite database (created on first run)
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── store/useStore.js   ← All state + API calls (Zustand)
    │   ├── components/Nav.jsx
    │   └── pages/
    │       ├── Dashboard.jsx
    │       ├── Itinerary.jsx
    │       ├── Stays.jsx
    │       ├── Transport.jsx
    │       ├── Finance.jsx
    │       └── MapPage.jsx
    └── package.json
```

---

## Stopping the App

Close both terminal windows (Backend and Frontend).

---

## When You're Ready for Option B (Cloud Hosting)

Just say the word — I'll add a `docker-compose.yml` and deployment instructions for Railway or Render (both have free tiers, app would be live in ~10 minutes).
