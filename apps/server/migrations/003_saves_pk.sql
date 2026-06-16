-- 003_saves_pk.sql
-- Tidy: `saves` is a pure join (user <-> place). Drop the surrogate `id` and
-- the redundant UNIQUE(user_id, place_id), and make (user_id, place_id) the
-- primary key. idx_saves_user is then redundant — the PK's leftmost column is
-- already user_id. Forward-only; guards make manual re-application safe.

ALTER TABLE saves DROP CONSTRAINT IF EXISTS saves_user_id_place_id_key;
DROP INDEX IF EXISTS idx_saves_user;

-- Dropping the id column also drops its primary-key constraint (saves_pkey).
ALTER TABLE saves DROP COLUMN IF EXISTS id;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'saves'::regclass AND contype = 'p'
  ) THEN
    ALTER TABLE saves ADD PRIMARY KEY (user_id, place_id);
  END IF;
END $$;
