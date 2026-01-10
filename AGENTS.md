# Agent Handbook

## Core Principle

Less is more. Keep every implementation as small, obvious, and intent-driven as
possible so new contributors can understand changes on first read.

### Day-to-day guardrails

- Simplicity first: choose the smallest solution that delivers the feature.
- Refactor only when duplication hurts clarity or maintenance; avoid speculative
  abstractions.
- Prefer existing utilities before introducing a new dependency.
- Mirror current naming and layout patterns; document any intentional deviation.
- Be explicit: clear names and type annotations beat clever shortcuts.
- If the code needs paragraphs of explanation, rewrite it until it speaks for
  itself.
- Do not over-apply "clean code" by exploding logic into many tiny helpers;
  favor readable, cohesive functions when it keeps intent obvious. Readability
  first.

## Project orientation

- **Game concept:** Jabruuuhtix is a real-time multiplayer guessing game. The
  backend computes semantic similarity with fastText embeddings and normalizes
  scores using a per-room max similarity.
- **Data flow:** the frontend reads `rooms` and `guesses` from Supabase and uses
  Realtime to stay in sync; writes (create room, submit guess) go through the
  FastAPI backend using the Supabase service role key.
- **Stack:** React 19 + Vite + TypeScript + Tailwind + shadcn/ui (New York style)
  plus 8bitcn components; FastAPI + fastText; Supabase Postgres + pgvector.
- **Services:** `frontend/` (Vite app) and `backend/` (FastAPI API). Shared
  configuration is in `.env` (copy from `.env.example`). Use Docker Compose for
  the full stack; `docker-compose.dev.yml` exposes ports for hot reload.
- **Supabase schema:** defined in `supabase/migrations/001_init.sql` with RLS and
  realtime on `rooms` and `guesses`.

## Working with this repo

- `frontend/`: code lives in `frontend/src` with domain models in `models/`,
  Supabase reads in `api/`, and realtime updates in `hooks/`. Prefer updating
  model classes (`Guess`, `Room`, `Player`) when API shapes change.
- UI primitives are in `frontend/src/components/ui` with 8bit variants under
  `frontend/src/components/ui/8bit`. Reuse these before adding new components.
- Realtime updates are centralized in `frontend/src/hooks/useRoomRealtime.ts`;
  keep event wiring there to avoid duplicate subscriptions.
- `backend/`: FastAPI app is in `backend/app`, routes are in `backend/app/routes`.
  Load secrets from `.env` via `backend/app/config.py` and update `.env.example`
  alongside new settings.
- `words.txt` provides the secret word list (lowercase expected). Keep it in sync
  with any game rule changes.
- `docker-compose.dev.yml` exposes API on 8081 and Vite on 3001. The production
  compose file does not expose ports.
- The backend downloads the fastText model on first start (large download); keep
  `FASTTEXT_*` settings documented in README and `.env.example`.

## MCP Tooling workflow

For broader library guidance, resolve the package via `resolve-library-id`, then
gather context with `get-library-docs` before drafting a response.

- Don't modify code without reading the surrounding context.
- Don't expose secrets.
- Don't ignore failures or warnings.
- Don't introduce unjustified optimization or abstraction.
- Don't overuse broad exceptions.

## ExecPlans

- For complex features or significant refactors, produce an ExecPlan (see
  `.agent/PLANS.md` and the existing execplans) and keep it updated from design
  through implementation.
