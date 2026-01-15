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
- Keep changes localized; avoid sweeping refactors.

## Project orientation

- **Game concept:** Jabruuuhtix is a real-time multiplayer guessing game. The
  backend computes semantic similarity with fastText embeddings and normalizes
  scores using a per-room max similarity.
- **Data flow:** the frontend reads `rooms` and `guesses` from Supabase and uses
  Realtime to stay in sync; writes (create room, submit guess) go through the
  FastAPI backend using the Supabase service role key.
- **Stack:** React 19 + Vite + TypeScript + Tailwind + shadcn/ui (New York
  style) plus 8bitcn components; FastAPI + fastText; Supabase Postgres +
  pgvector.
- **Services:** `frontend/` (Vite app) and `backend/` (FastAPI API). Shared
  configuration is in `.env` (copy from `.env.example`). Use Docker Compose for
  the full stack; `docker-compose.dev.yml` exposes ports for hot reload.
- **Supabase schema:** defined in `supabase/migrations/001_init.sql` with RLS
  and realtime on `rooms` and `guesses`.

## Repo map and change hotspots

- `frontend/`: code lives in `frontend/src` with domain models in `models/`,
  Supabase reads in `api/`, and realtime updates in `hooks/`. Prefer updating
  model classes (`Guess`, `Room`, `Player`) when API shapes change.
- UI primitives are in `frontend/src/components/ui` with 8bit variants under
  `frontend/src/components/ui/8bit`. Reuse these before adding new components.
- Realtime updates are centralized in `frontend/src/hooks/useRoomRealtime.ts`;
  keep event wiring there to avoid duplicate subscriptions.
- `backend/`: FastAPI app is in `backend/app`, routes are in
  `backend/app/routes`. Load secrets from `.env` via `backend/app/config.py` and
  update `.env.example` alongside new settings.
- `OpenLexicon.tsv` provides the lexicon data used for word filtering. Keep it
  in sync with any game rule changes.
- `docker-compose.dev.yml` exposes API on 8081 and Vite on 3001. The production
  compose file does not expose ports.
- The backend downloads the fastText model on first start (large download); keep
  `FASTTEXT_*` settings documented in README and `.env.example`.

## Build, lint, and test commands

Run commands from the repo root unless noted.

### Frontend (Vite + React)

- `cd frontend`
- `npm install`
- `npm run dev` (Vite dev server)
- `npm run build` (TypeScript build + Vite build)
- `npm run lint` (ESLint)
- `npm run preview` (preview production build)
- **Tests:** no test runner configured.
- **Single test:** not available (no tests configured).

### Backend (FastAPI)

- `pip install -r backend/requirements.txt`
- `python -m uvicorn backend.app.main:app --reload --port 8081` (local dev)
- **Lint:** no backend lint command configured.
- **Tests:** no test runner configured.
- **Single test:** not available (no tests configured).

### Full stack (Docker)

- `docker-compose -f docker-compose.dev.yml up --build` (dev with hot reload)
- `docker-compose up -d --build` (production)

## Frontend code style (TypeScript/React)

- Use the `@/` path alias for `frontend/src` imports; keep relative imports for
  same-folder or tight coupling.
- Use `import type { ... }` for type-only imports (matches existing usage).
- Group imports: external libraries, aliased internal modules, relative modules;
  separate groups with blank lines.
- Prefer `interface` for component props and `type` for unions or aliases.
- Components are PascalCase; hooks are `useX`; variables and functions are
  camelCase.
- Prefer explicit types for function params and return types when inference is
  not obvious or when data crosses module boundaries.
- Keep React components functional and cohesive; avoid splitting small logic
  into micro-helpers unless clarity improves.
- Formatting mirrors existing files: 4-space indentation, semicolons, double
  quotes for strings, trailing commas where the formatter already uses them.
- Use Tailwind classes directly in `className`; keep long lists readable and
  aligned with existing layout.
- Reuse UI primitives in `components/ui` and `components/ui/8bit` instead of
  adding new UI components.
- Place Supabase reads in `frontend/src/api` or `frontend/src/lib/supabase.ts`;
  keep data models in `frontend/src/models` and update them when API shapes
  change.
- Realtime subscriptions belong in `frontend/src/hooks/useRoomRealtime.ts`.

## Backend code style (Python/FastAPI)

- Define request/response payloads with Pydantic `BaseModel` classes.
- Use `Field` constraints for validation (e.g., `max_length`).
- Use `Literal` for enum-like inputs and `Optional` for nullable outputs.
- Keep routers in `backend/app/routes` with clear prefixes and tags.
- Imports order: standard library, third-party, local modules; add blank lines
  between groups.
- Naming: snake_case for functions/variables, PascalCase for classes, ALL_CAPS
  for constants.
- Formatting: 4-space indentation, double-quoted strings, concise docstrings.
- Use `logging.getLogger(__name__)` for module-level logging.
- Error handling: raise `HTTPException` with explicit status codes; wrap
  external calls (Supabase, embeddings) in `try/except` and surface clear error
  messages.
- Avoid broad exceptions unless logging and returning an explicit error
  response.
- Do not leak secrets; keep new settings in `.env` and `.env.example`.

## Error handling expectations

- Prefer early validation and explicit error messages.
- Use HTTP status codes consistently in the backend (`400`, `404`, `500`).
- Surface user-friendly errors in the frontend without exposing raw stack
  traces.

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
