-- Add room mode (coop or jcj)
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS mode TEXT;

UPDATE rooms SET mode = 'coop' WHERE mode IS NULL;

ALTER TABLE rooms ALTER COLUMN mode SET DEFAULT 'coop';
ALTER TABLE rooms ALTER COLUMN mode SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'rooms_mode_check'
    ) THEN
        ALTER TABLE rooms
            ADD CONSTRAINT rooms_mode_check
            CHECK (mode IN ('coop', 'jcj'));
    END IF;
END $$;
