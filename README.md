# 🎮 Jabruuuhtix

> Jeu de mots temps réel basé sur la similarité sémantique (embeddings fastText).

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat&logo=supabase&logoColor=white)

## 🎯 Concept

Jabruuuhtix est un jeu multijoueur en temps réel où les joueurs doivent deviner un mot secret. Chaque proposition est évaluée par similarité sémantique grâce aux embeddings fastText. Plus votre mot est "proche" du mot secret, plus votre score est élevé !

- **Score 100** = Vous avez trouvé le mot exact !
- **Score 80+** = Très proche
- **Score 50+** = Vous vous rapprochez
- **Score < 50** = Continuez à chercher
- **Modes** : COOP (tout le monde voit les propositions) / JCJ (les mots des
  autres sont masqués tant que vous n'avez pas trouvé le mot)

## 🚀 Installation

### Prérequis

- Docker & Docker Compose
- Un projet Supabase
- Un token Hugging Face (pour télécharger le modèle fastText)

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
HF_TOKEN=your-huggingface-token

# Frontend (passées au build Docker)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=https://your-api-domain.com  # URL publique de l'API
```

### 2. Base de données

Exécutez les scripts SQL dans votre projet Supabase :
```bash
# Via Supabase CLI ou copier/coller dans l'éditeur SQL
cat supabase/migrations/001_init.sql
cat supabase/migrations/002_room_mode.sql
```

### 3. Déploiement Docker

```bash
# Build et lancement complet (frontend + backend)
docker-compose up -d --build

# L'app sera disponible sur :
# - Frontend : http://localhost:3000
# - API : http://localhost:8081
```

### 🐳 Déploiement Dokploy

Pour Dokploy, configurez chaque service séparément :

**Backend (embedding-api)**
- Build context: `./backend`
- Port: `8081`
- Variables d'env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `HF_TOKEN`

**Frontend**
- Build context: `./frontend`
- Port: `80`
- Build args: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`

> ⚠️ Le premier démarrage du backend télécharge le modèle fastText (~7GB).

## 🎮 Comment jouer

1. **Entrez votre pseudo**
2. **Créez une salle** ou **rejoignez** avec un code
3. **Proposez des mots** et observez votre score
4. Trouvez le mot avec un score de **100** pour gagner !

## 🛠️ Stack technique

| Couche | Technologies |
|--------|-------------|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS, Shadcn UI + 8bitcn |
| Backend | FastAPI, Python 3.11, fastText |
| Base de données | Supabase (PostgreSQL + pgvector) |
| Temps réel | Supabase Realtime |
| Infra | Docker, Docker Compose |

## 📁 Structure

```
jabruuuhtix/
├── frontend/           # React + Vite + TypeScript
├── backend/            # FastAPI + fastText
│   ├── app/
│   │   ├── main.py
│   │   ├── embeddings.py
│   │   └── routes/
│   └── words.txt       # Liste des mots secrets
├── supabase/
│   └── migrations/     # Schéma SQL
├── docker-compose.yml
└── .env.example
```

## 📡 API

### `POST /api/rooms`
Crée une nouvelle salle de jeu.
```json
{ "playerName": "Alex" }
→ { "roomId", "roomCode", "createdAt" }
```

### `POST /api/guesses`
Soumet une proposition de mot.
```json
{ "roomCode": "ABC123", "playerId": "uuid", "playerName": "Alex", "word": "chat" }
→ { "guessId", "roomId", "word", "score", "createdAt", "revealedWord" }
```

## 🔧 Variables d'environnement

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | URL du projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role |
| `HF_TOKEN` | Token Hugging Face |
| `VITE_SUPABASE_URL` | URL Supabase (frontend) |
| `VITE_SUPABASE_ANON_KEY` | Clé anon (frontend) |
| `VITE_API_URL` | URL de l'API (défaut: `http://localhost:8081`) |

## 📝 License

MIT
