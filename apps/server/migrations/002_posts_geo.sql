-- 002_posts_geo.sql
-- Reshape the core from a standing per-user-per-place "recommendation" into a
-- timeline of per-visit "posts", add PostGIS for proximity ("near me") search,
-- and dedup places by their external id.
--
-- This migration TRANSFORMS existing rows (each recommendation becomes one
-- post, photos and reason-tags are repointed). It is forward-only; the runner
-- applies it exactly once inside a transaction. Structural steps are guarded
-- with IF [NOT] EXISTS so manual re-application is also safe.

CREATE EXTENSION IF NOT EXISTS postgis; -- requires a PostGIS-enabled image (see docker-compose.yml)

-- 1. posts: each visit is its own content item (no UNIQUE(user, place)) -------
CREATE TABLE IF NOT EXISTS posts (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES users (id)  ON DELETE CASCADE,
  place_id             uuid NOT NULL REFERENCES places (id) ON DELETE CASCADE,
  recommendation_value text NOT NULL CHECK (recommendation_value IN ('yes', 'maybe', 'no')),
  visibility           text NOT NULL DEFAULT 'friends'
                         CHECK (visibility IN ('private', 'friends', 'public')),
  note                 text,
  visited_at           date,                       -- optional; created_at = when posted
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- Carry existing recommendations over as the first post per (user, place),
-- preserving ids so photos and reason-tag links repoint cleanly below.
INSERT INTO posts (id, user_id, place_id, recommendation_value, visibility, created_at, updated_at)
SELECT id, user_id, place_id, recommendation_value, visibility, created_at, updated_at
FROM recommendations
ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_posts_place ON posts (place_id);
CREATE INDEX IF NOT EXISTS idx_posts_user  ON posts (user_id);
-- The "latest post per user per place" path that one-vote-per-user scoring rides on.
CREATE INDEX IF NOT EXISTS idx_posts_user_place_recent
  ON posts (user_id, place_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_posts_updated_at ON posts;
CREATE TRIGGER trg_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 2. post_reason_tags: the reason-tag join, repointed from recommendations ----
CREATE TABLE IF NOT EXISTS post_reason_tags (
  post_id       uuid NOT NULL REFERENCES posts (id)       ON DELETE CASCADE,
  reason_tag_id uuid NOT NULL REFERENCES reason_tags (id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, reason_tag_id)
);
INSERT INTO post_reason_tags (post_id, reason_tag_id)
SELECT recommendation_id, reason_tag_id FROM recommendation_reason_tags
ON CONFLICT DO NOTHING;
DROP TABLE IF EXISTS recommendation_reason_tags;

-- 3. photos now belong to a post (place_id/user_id stay denormalized) ---------
ALTER TABLE photos ADD COLUMN IF NOT EXISTS post_id  uuid REFERENCES posts (id) ON DELETE CASCADE;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS position int NOT NULL DEFAULT 0; -- gallery order within a post

-- recommendation_id already equals the new post id; copy, then drop the column.
-- Photos with no recommendation have no post to attach to in the new model;
-- drop them (a no-op on seed data, which always links a recommendation).
DELETE FROM photos WHERE recommendation_id IS NULL;
UPDATE photos SET post_id = recommendation_id WHERE post_id IS NULL;

DROP INDEX IF EXISTS idx_photos_recommendation;
ALTER TABLE photos DROP COLUMN IF EXISTS recommendation_id;
ALTER TABLE photos ALTER COLUMN post_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_photos_post ON photos (post_id);

-- 4. drop the now-empty recommendations table --------------------------------
DROP TABLE IF EXISTS recommendations;

-- 5. places: PostGIS geography + external-id dedup ---------------------------
ALTER TABLE places ADD COLUMN IF NOT EXISTS geog geography(Point, 4326);

-- Keep latitude/longitude as the client-facing values; derive geog from them
-- for spatial queries. A GENERATED column can't be used (the geography cast
-- isn't IMMUTABLE), so a trigger maintains it on insert and on lat/long change.
CREATE OR REPLACE FUNCTION set_place_geog()
RETURNS trigger AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.geog := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  ELSE
    NEW.geog := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_places_geog ON places;
CREATE TRIGGER trg_places_geog
  BEFORE INSERT OR UPDATE OF latitude, longitude ON places
  FOR EACH ROW EXECUTE FUNCTION set_place_geog();

-- Backfill existing rows (this UPDATE doesn't touch lat/long, so it won't fire
-- the trigger — it sets geog directly).
UPDATE places
SET geog = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_places_geog ON places USING gist (geog);

-- One place per external id (dedup ingested Google places); NULLs unconstrained.
CREATE UNIQUE INDEX IF NOT EXISTS idx_places_ext_google
  ON places (external_google_place_id) WHERE external_google_place_id IS NOT NULL;
