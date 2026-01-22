-- Align schema with gameplay scoring and difficulty tiers

ALTER TABLE rooms
    ADD COLUMN IF NOT EXISTS mode VARCHAR(10) DEFAULT 'coop',
    ADD COLUMN IF NOT EXISTS difficulty VARCHAR(10) DEFAULT 'auto';

ALTER TABLE room_secrets
    ADD COLUMN IF NOT EXISTS min_similarity FLOAT DEFAULT 0.1,
    ADD COLUMN IF NOT EXISTS top_1000_words JSONB DEFAULT '[]'::jsonb;

ALTER TABLE room_secrets
    ALTER COLUMN top_1000_words SET DEFAULT '[]'::jsonb;

UPDATE room_secrets
SET top_1000_words = '[]'::jsonb
WHERE top_1000_words IS NULL;

ALTER TABLE guesses
    ADD COLUMN IF NOT EXISTS rank INTEGER,
    ADD COLUMN IF NOT EXISTS temperature FLOAT DEFAULT 0.0;
