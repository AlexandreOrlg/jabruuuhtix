# 🎮 Jabruuuhtix

> Jeu de mots temps réel basé sur la similarité sémantique (embeddings Word2Vec).

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat&logo=supabase&logoColor=white)

## 🎯 Concept

Jabruuuhtix est un jeu multijoueur en temps réel inspiré de **Cémantix**. Les joueurs doivent deviner un mot secret en proposant des mots. Chaque proposition est évaluée par similarité sémantique grâce aux embeddings Word2Vec.

### Système de scoring

| Indicateur | Description |
|------------|-------------|
| **Score %** | Pourcentage de similarité (0-100%) |
| **Rang ‰** | Position parmi les 1000 mots les plus proches (999 = le plus proche) |
| **Température °C** | Indicateur visuel façon Cémantix |

### Échelle de température

| Température | Signification | Emoji |
|-------------|---------------|-------|
| 100°C | Mot exact trouvé ! | 🔥 |
| 50-73°C | Très chaud (top 100) | 🌡️ |
| 24-50°C | Tiède (dans top 1000) | 🫡 |
| < 24°C | Froid (hors top 1000) | ❄️ |
| Négatif | Très froid | 🧊 |

- **Modes** : COOP (tout le monde voit les propositions) / JCJ (les mots des autres sont masqués)

## 🚀 Installation

### Prérequis

- Docker & Docker Compose
- Un projet Supabase

### 1. Configuration

```bash
# Cloner et entrer dans le projet
cd jabruuuhtix

# Copier les variables d'environnement
cp .env.example .env
```

Remplissez `.env` avec vos valeurs :
```env
# Backend
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Frontend (passées au build Docker)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=https://your-api-domain.com
```

### 2. Base de données

Exécutez les scripts SQL dans votre projet Supabase :
```sql
-- Activer pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Tables principales
CREATE TABLE rooms (...);
CREATE TABLE room_secrets (
    ...
    secret_embedding vector(500),  -- Word2Vec 500 dimensions
    top_1000_words JSONB,
    min_similarity FLOAT
);
CREATE TABLE guesses (
    ...
    rank INTEGER,
    temperature FLOAT
);
```

### 3. Lancement

```bash
# Développement (avec hot-reload)
docker-compose -f docker-compose.dev.yml up --build

# Production
docker-compose up -d --build

# Ports :
# - Frontend : http://localhost:3001 (dev) / http://localhost:3000 (prod)
# - API : http://localhost:8081
```

> ⚠️ Le premier démarrage télécharge le modèle Word2Vec (~298 MB).

## 🎮 Comment jouer

1. **Entrez votre pseudo**
2. **Créez une salle** ou **rejoignez** avec un code
3. **Proposez des mots** et observez votre score, rang et température
4. Trouvez le mot avec un score de **100%** pour gagner !

## 🛠️ Stack technique

| Couche | Technologies |
|--------|-------------|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS, Shadcn UI + 8bitcn |
| Backend | FastAPI, Python 3.11, gensim (Word2Vec) |
| Embeddings | frWac Word2Vec (Jean-Philippe Fauconnier) |
| Base de données | Supabase (PostgreSQL + pgvector) |
| Temps réel | Supabase Realtime |
| Infra | Docker, Docker Compose |

## 📁 Structure

```
jabruuuhtix/
├── frontend/           # React + Vite + TypeScript
├── backend/            # FastAPI + Word2Vec
│   ├── app/
│   │   ├── main.py
│   │   ├── embeddings.py   # Word2Vec + température
│   │   └── routes/
│   └── OpenLexicon.tsv # Lexique utilisé pour filtrer les mots
├── supabase/
│   └── migrations/
├── docker-compose.yml
├── docker-compose.dev.yml
└── .env.example
```

## 📡 API

### `POST /api/rooms`
Crée une nouvelle salle de jeu.
```json
{ "playerName": "Alex", "mode": "coop" }
→ { "roomId", "roomCode", "createdAt" }
```

### `POST /api/guesses`
Soumet une proposition de mot.
```json
{ "roomCode": "ABC123", "playerId": "uuid", "playerName": "Alex", "word": "chat" }
→ { "guessId", "word", "score", "rank", "temperature", "createdAt", "revealedWord" }
```

## 🙏 Crédits

- Modèle Word2Vec français : [Jean-Philippe Fauconnier](https://fauconnier.github.io/#data)
- Inspiré de [Cémantix](https://cemantix.certitudes.org)

## 📝 License

MIT
