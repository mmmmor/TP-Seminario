# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**InfoCba** is a civic reporting platform for Córdoba, Argentina. Citizens can submit geolocated reports of urban problems (potholes, street lighting, waste, etc.), vote on reports, and track their resolution. It is a full-stack app with a React frontend and a FastAPI backend.

## Development Commands

### Backend (FastAPI + Python)

```bash
cd backend
# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn server:app --reload --host 0.0.0.0 --port 8000

# Linting / formatting
black server.py
isort server.py
flake8 server.py
mypy server.py
```

### Frontend (React)

```bash
cd frontend
npm install

# Start dev server (http://localhost:3000)
npm start

# Production build
npm run build
```

## Architecture

### Backend (`backend/server.py`)

The entire backend lives in a single file. It uses:
- **FastAPI** with a single `APIRouter` prefixed at `/api`
- **MongoDB via Motor** (async): collections are `users`, `reports`, `votes`, `login_attempts`
- **JWT auth**: 15-minute access tokens + 7-day refresh tokens. Tokens are returned in JSON response bodies (not cookies) and the frontend stores them in `localStorage` as `iv_access_token` / `iv_refresh_token`. The `get_current_user` dependency checks both the `Authorization: Bearer` header and the `access_token` cookie (cookies are a fallback).
- **Object storage**: images are uploaded to an external Emergent Agent object store via `put_object` / `get_object` helpers. The storage key is lazily initialized via `init_storage()`.
- **Roles**: `user` (default) and `admin`. Admin credentials are seeded from env vars on startup.
- **Report statuses**: `pending`, `resolved` (plus any admin-set value).
- **Voting**: one vote per user per report (up/down); toggling the same direction removes the vote. A `vote_score_override` field on a report document overrides the computed score.

Key API routes:
| Method | Path | Auth |
|--------|------|------|
| POST | `/api/auth/register` | — |
| POST | `/api/auth/login` | — |
| POST | `/api/auth/logout` | — |
| POST | `/api/auth/refresh` | — |
| GET  | `/api/auth/me` | user |
| GET  | `/api/reports` | — |
| POST | `/api/reports` | user |
| PATCH | `/api/reports/{id}` | admin |
| PUT  | `/api/reports/{id}/status` | admin |
| DELETE | `/api/reports/{id}` | admin |
| POST | `/api/reports/{id}/vote` | user |
| GET  | `/api/votes/mine` | user |
| GET  | `/api/reports/stats` | — |
| GET  | `/api/files/{path}` | — |

### Frontend (`frontend/src/`)

React 18 SPA with React Router v6. Entry point: `App.js`.

**Routing:**
- `/` → `Landing` (public)
- `/iniciar-sesion` → `Login` (redirects away if authenticated)
- `/registro` → `Register` (redirects away if authenticated)
- `/nuevo-reporte` → `NewReport` (requires auth)
- `/admin` → `Admin` (requires auth + admin role)

**Key contexts:**
- `AuthContext` (`src/contexts/AuthContext.js`): handles login/register/logout, stores JWTs in `localStorage`, sets up global Axios interceptors that (1) inject `Authorization: Bearer` on every request and (2) auto-refresh the access token on 401 responses.
- `DarkModeContext` (`src/context/DarkModeContext.jsx`): toggles a dark mode class.

**Styling:** Tailwind CSS. Brand color is `primary` = `#7C3AED` (violet). Fonts: `Cabinet Grotesk` (headings), `IBM Plex Sans` (body), `IBM Plex Mono` (mono). Max content width: `1320px`.

**Maps:** React Leaflet + OpenStreetMap tiles (CartoDB light). Nominatim is used for geocoding and reverse-geocoding directly from the browser.

**Report categories:** `baches`, `alumbrado`, `residuos`, `construccion`, `extravios`.

### Environment Variables

Backend (`.env`):
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=infovia_db
JWT_SECRET=<secret>
ADMIN_EMAIL=admin@infovia.com
ADMIN_PASSWORD=Admin123!
EMERGENT_LLM_KEY=<key>
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=*
```

Frontend: set `REACT_APP_BACKEND_URL` (defaults to `http://localhost:8000`).
