-- Match the guesses query ordering: room_id, score desc, created_at desc
CREATE INDEX IF NOT EXISTS idx_guesses_room_score_created
    ON guesses (room_id, score DESC, created_at DESC);

-- Redundant with the new composite index
DROP INDEX IF EXISTS idx_guesses_score;
