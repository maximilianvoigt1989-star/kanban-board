# Kanban Board

Umsetzung des PRD (`ai_docs/PRD.md`): Next.js + Tailwind + dnd-kit, FastAPI + SQLite.

```
src/backend/    FastAPI + SQLite (kanban.db wird beim ersten Start angelegt)
src/frontend/   Next.js (App Router, TypeScript, Tailwind)
```

## Starten

Zwei Terminals, jeweils ab `kanban-board/`:

```bash
# 1) Backend (Port 8000)
pip install -r src/backend/requirements.txt
python -m uvicorn src.backend.main:app --reload --port 8000

# 2) Frontend (Port 3000)
cd src/frontend
npm install
npm run dev
```

Das Frontend leitet `/api/*` per Rewrite an `http://127.0.0.1:8000` weiter (`next.config.mjs`).
API-Doku: http://localhost:8000/docs

> Der Backend-Pfad ist `src.backend.main:app` (PRD: Code liegt unter `src/`), nicht `backend.main:app`.
