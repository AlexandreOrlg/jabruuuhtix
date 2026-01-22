-- Align secret_embedding with the 700d frWac model
-- Note: this will fail if existing rows have 500d vectors. In dev, delete room_secrets first.
ALTER TABLE room_secrets
    ALTER COLUMN secret_embedding TYPE vector(700);
