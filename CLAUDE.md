# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Full-stack ecommerce platform where AI is central to every screen. Hackathon demo — no database, mock JSON data only.

**Stack:** React (Vite) + TailwindCSS frontend · Node.js/Express backend · HuggingFace Inference API (primary AI) · Ollama (local fallback)

## Commands

```bash
# Backend (run from server/)
npm install
cp .env.example .env   # then add HUGGINGFACE_API_KEY
npm run dev            # nodemon on port 3001

# Frontend (run from client/)
npm install
npm run dev            # Vite dev server on port 5173
```

Both must run concurrently for the app to work. Vite proxies all `/api/*` requests to `http://localhost:3001`.

## Environment Setup
`server/.env.example` contains all required variables. The only one needed to get AI working:
```
HUGGINGFACE_API_KEY=your_key_here
```
If the key is missing or HuggingFace fails, the backend automatically falls back to Ollama at `OLLAMA_URL` (default: `http://localhost:11434`). If both fail, the UI shows a graceful error.

## AI Architecture
All AI calls are routed through a single backend endpoint: `POST /api/ai`

- **Request shape:** `{ prompt, context, screen }` — `context` is the current screen's data serialized as JSON; `screen` is a label string
- **Fallback chain:** HuggingFace chat completions → Ollama `/api/chat` → 503 with user-facing error message
- **Frontend hook:** `useAI()` (`client/src/hooks/useAI.js`) — returns `{ response, loading, error, ask, reset }`
- **Frontend component:** `<AIPanel screen="..." contextData={...} defaultPrompt="..." />` — auto-runs `defaultPrompt` on mount, shows response, and has a follow-up input. Used on every screen.
- Model is configured via `AI_MODEL` in `.env` — swapping models requires no UI changes

## Screens & Routes

| Screen | Path | Data endpoint | AI default prompt |
|---|---|---|---|
| Dashboard | `/` | `GET /api/dashboard` | Store health summary |
| Inventory | `/inventory` | `GET /api/inventory` | Stockout risk & reorder priorities |
| Listings | `/listings` | `GET /api/listings` | Performance analysis + per-listing AI description generator |
| AI Interaction | `/ai` | none (direct chat) | Full chat UI with suggested prompts |
| Customer Support | `/support` | `GET /api/support` | Ticket prioritization + per-ticket AI draft reply |
| Reports | `/reports` | `GET /api/reports` | Revenue trends & business insights |

## Key Conventions
- Mock data lives in `server/mock/*.json` — never hardcode data in components or routes
- `<AIPanel />` is the only AI display component; pass `screen` and `contextData` as props, do not fork it per-screen
- The Listings and Support pages also call `useAI()` directly (per-card) for per-item AI actions (description generation, draft replies)
- Use async/await throughout — no `.then()` chains
- All AI calls must handle errors and show a fallback UI message (the `error` state from `useAI()`)
