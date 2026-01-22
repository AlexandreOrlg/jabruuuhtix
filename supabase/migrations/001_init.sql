-- Enable pgvector extension for embedding storage
CREATE EXTENSION IF NOT EXISTS vector;

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(6) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'finished')),
    revealed_word TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Room secrets table (stores the secret word and its embedding)
CREATE TABLE IF NOT EXISTS room_secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID UNIQUE NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    secret_word TEXT NOT NULL,
    secret_embedding vector(700) NOT NULL,
    max_similarity FLOAT DEFAULT 0.7,  -- For score normalization
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guesses table
CREATE TABLE IF NOT EXISTS guesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    player_id UUID NOT NULL,
    player_name VARCHAR(32) NOT NULL,
    word TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);
CREATE INDEX IF NOT EXISTS idx_guesses_room_id ON guesses(room_id);
CREATE INDEX IF NOT EXISTS idx_guesses_score ON guesses(room_id, score DESC);

-- Enable Row Level Security
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE guesses ENABLE ROW LEVEL SECURITY;

-- RLS Policies: rooms table
-- Allow anyone to read rooms
CREATE POLICY "Allow read access to rooms" ON rooms
    FOR SELECT USING (true);

-- Only service role can insert/update rooms
CREATE POLICY "Service role can insert rooms" ON rooms
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update rooms" ON rooms
    FOR UPDATE USING (true);

-- RLS Policies: room_secrets table
-- No direct read access (secret should never be exposed via Supabase client)
CREATE POLICY "No direct access to room_secrets" ON room_secrets
    FOR SELECT USING (false);

-- Service role can manage room_secrets
CREATE POLICY "Service role can insert room_secrets" ON room_secrets
    FOR INSERT WITH CHECK (true);

-- RLS Policies: guesses table
-- Allow anyone to read guesses
CREATE POLICY "Allow read access to guesses" ON guesses
    FOR SELECT USING (true);

-- Service role can insert guesses
CREATE POLICY "Service role can insert guesses" ON guesses
    FOR INSERT WITH CHECK (true);

-- Enable Realtime for guesses table
ALTER PUBLICATION supabase_realtime ADD TABLE guesses;
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;

ALTER TABLE room_secrets DISABLE ROW LEVEL SECURITY;


-- Supprimer l'ancienne policy et en créer une qui autorise tout
DROP POLICY IF EXISTS "Service role can insert room_secrets" ON room_secrets;
DROP POLICY IF EXISTS "No direct access to room_secrets" ON room_secrets;
-- Autoriser toutes les opérations (le service role bypass RLS de toute façon)
CREATE POLICY "Allow all operations on room_secrets" ON room_secrets
    FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE room_secrets ADD COLUMN max_similarity FLOAT DEFAULT 0.7;
