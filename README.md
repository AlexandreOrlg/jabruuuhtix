# Jabruuuhtix

Real‑time multiplayer word‑guessing game inspired by Cémantix, using semantic similarity to guide players to a secret word.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat&logo=supabase&logoColor=white)

## Features

- Real‑time multiplayer rooms (no accounts, just a nickname).
- Rich feedback: similarity score, rank, and temperature.
- Two modes: COOP (shared guesses) or PVP (hidden guesses).
- Docker‑first dev and production setup.

## Gameplay

1. Enter a nickname.
2. Create or join a room with a code.
3. Submit guesses and watch the feedback.
4. Reach 100% to reveal the secret word.

## Tech Stack

- Frontend: React 19, Vite, TypeScript, Tailwind, shadcn/ui
- Backend: FastAPI, Python 3.11, gensim
- Database: Supabase (Postgres + pgvector)
- Realtime: Supabase Realtime

## Quickstart (Docker)

### Prerequisites

- Docker & Docker Compose
- A Supabase project

### 1) Configure environment

```bash
cp .env.example .env
```

Fill in these required values:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:8081
```

> The embedding model is downloaded on first run and can take a few minutes.

### 2) Database setup (Supabase)

Run the migration:

- `supabase/migrations/001_init.sql`

### 3) Run

```bash
# Development (hot reload)
docker-compose -f docker-compose.dev.yml up --build

# Production
docker-compose up -d --build
```

Default ports:
- Frontend: `http://localhost:3001` (dev) / `http://localhost:3000` (prod)
- API: `http://localhost:8081`

## Local Development (without Docker)

```bash
# Backend
pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --reload --port 8081

# Frontend
cd frontend
npm install
npm run dev
```

## API (minimal)

### `POST /api/rooms`
Create a room.

```json
{ "playerName": "Alex", "mode": "coop" }
```

### `POST /api/guesses`
Submit a guess.

```json
{ "roomCode": "ABC123", "playerId": "uuid", "playerName": "Alex", "word": "chat" }
```

## Contributing

Issues and pull requests are welcome. Please include context, rationale, and tests when relevant.

## License

MIT
