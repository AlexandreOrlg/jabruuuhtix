-- Re-secure RLS and policies for public reads only

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE guesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_secrets ENABLE ROW LEVEL SECURITY;

ALTER TABLE rooms FORCE ROW LEVEL SECURITY;
ALTER TABLE guesses FORCE ROW LEVEL SECURITY;
ALTER TABLE room_secrets FORCE ROW LEVEL SECURITY;

-- Remove permissive policies
DROP POLICY IF EXISTS "Allow read access to rooms" ON rooms;
DROP POLICY IF EXISTS "Service role can insert rooms" ON rooms;
DROP POLICY IF EXISTS "Service role can update rooms" ON rooms;

DROP POLICY IF EXISTS "Allow read access to guesses" ON guesses;
DROP POLICY IF EXISTS "Service role can insert guesses" ON guesses;

DROP POLICY IF EXISTS "Allow all operations on room_secrets" ON room_secrets;
DROP POLICY IF EXISTS "Service role can insert room_secrets" ON room_secrets;
DROP POLICY IF EXISTS "No direct access to room_secrets" ON room_secrets;

-- Minimal public read policies
CREATE POLICY "rooms_select_public" ON rooms
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "guesses_select_public" ON guesses
    FOR SELECT TO anon, authenticated
    USING (true);
