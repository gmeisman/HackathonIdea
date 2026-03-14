# HackathonIdea — AI-Core Ecommerce Platform

An AI-first full-stack ecommerce platform where artificial intelligence is central to every screen. Built for hackathon demonstration with a production-ready architecture.

## Live Features

- **AI on every screen** — each page has a built-in AI panel that analyzes the current data and answers questions
- **Autonomous operations** — configurable autonomy settings let the AI act automatically below a dollar threshold, or request one-click approval above it
- **Audit log** — every autonomous action is logged with the AI's reasoning, timestamp, and outcome
- **Multi-channel listings** — manage and post products to eBay and Amazon (mock integration, API-ready)
- **Inventory management** — track stock levels, reorder triggers, and AI-predicted stockouts
- **Customer support** — AI drafts ticket replies and categorizes by sentiment
- **Reports** — AI-generated natural language summaries of sales, inventory, and performance data

## Screens

| Screen | Path | Description |
|---|---|---|
| Dashboard | `/` | KPI overview with AI store health summary |
| Inventory | `/inventory` | Stock levels, reorder suggestions, stockout predictions |
| Listings | `/listings` | Product listings with AI-generated descriptions, eBay/Amazon posting |
| AI Interaction | `/ai` | Free-form chat with full store data as context |
| Customer Support | `/support` | Ticket management with AI-drafted replies and sentiment tags |
| Reports | `/reports` | Data visualizations with AI narrative summaries |
| Autonomy Settings | `/settings` | Configure auto vs semi-auto thresholds, per-category overrides, emergency pause |
| Audit Log | `/audit` | Full log of all autonomous AI actions with approve/reject controls |

## Tech Stack

- **Frontend** — React (Vite), React Router, TailwindCSS
- **Backend** — Node.js, Express
- **AI Engine** — Ollama (local, free) with HuggingFace Inference API fallback
- **Default Model** — Llama 3.2 via Ollama
- **Data** — Mock JSON (no database required)

## AI Architecture

All AI calls go through a single backend endpoint: `POST /api/ai`

- **Request shape:** `{ prompt, context: { allData, filteredData, activeFilters }, screen }`
- The AI receives both the full dataset and the user's current filtered view
- **Fallback chain:** HuggingFace → Ollama → graceful error message
- Swap models by changing `AI_MODEL` in `server/.env` — no UI changes needed

## Getting Started

### Prerequisites
- Node.js 18+
- [Ollama](https://ollama.com) installed and running with Llama 3.2:
  ```bash
  ollama run llama3.2
  ```

### Installation

**Terminal 1 — Backend:**
```bash
cd server
npm install
cp .env.example .env
# Add your HUGGINGFACE_API_KEY to .env (optional, Ollama works without it)
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd client
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Environment Variables

```
HUGGINGFACE_API_KEY=your_key_here   # Optional if using Ollama
AI_MODEL=meta-llama/Meta-Llama-3-8B-Instruct
OLLAMA_URL=http://localhost:11434
PORT=3001
```

## Autonomy System

The platform supports three autonomy modes configurable per category:

- **Full Auto** — AI executes actions automatically when below the dollar threshold
- **Semi-Auto** — AI drafts the action and waits for one-click human approval
- **Manual** — AI recommends only, no actions taken without explicit user initiation

An **emergency pause** toggle instantly freezes all autonomous actions across the platform.

## Project Structure

```
HackathonIdea/
├── client/
│   └── src/
│       ├── pages/          # One file per screen
│       ├── components/     # Shared UI (AIPanel.jsx, etc.)
│       └── hooks/          # useAI.js and other custom hooks
├── server/
│   ├── routes/             # ai.js, inventory.js, listings.js, etc.
│   ├── mock/               # JSON mock data files
│   └── index.js
└── CLAUDE.md
```

## Roadmap

- Real database (PostgreSQL or MongoDB)
- Live eBay/Amazon SP-API integration
- OAuth login and multi-user support
- Fine-tuned model on store-specific data
- Mobile app
