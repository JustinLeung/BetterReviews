-- 001_init_schema.sql
-- Initial schema for the photo-first local recommendation app.
-- Written to be idempotent (CREATE ... IF NOT EXISTS, CHECK constraints rather
-- than enum types) so the migration runner can re-run it safely.

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- provides gen_random_uuid()

-- updated_at maintenance ----------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Users ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  username     text NOT NULL UNIQUE,
  avatar_url   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Places --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS places (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                     text NOT NULL,
  category                 text,
  address                  text,
  city                     text,
  country                  text,
  latitude                 double precision,
  longitude                double precision,
  external_google_place_id text,
  external_source          text,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_places_city ON places (lower(city));
CREATE INDEX IF NOT EXISTS idx_places_category ON places (lower(category));

-- Reason tags (reference data) ----------------------------------------------
CREATE TABLE IF NOT EXISTS reason_tags (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label     text NOT NULL UNIQUE,
  sentiment text NOT NULL CHECK (sentiment IN ('positive', 'neutral', 'negative'))
);

-- Recommendations (the core signal) -----------------------------------------
CREATE TABLE IF NOT EXISTS recommendations (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  place_id             uuid NOT NULL REFERENCES places (id) ON DELETE CASCADE,
  recommendation_value text NOT NULL CHECK (recommendation_value IN ('yes', 'maybe', 'no')),
  visibility           text NOT NULL DEFAULT 'friends'
                         CHECK (visibility IN ('private', 'friends', 'public')),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  -- One recommendation per user per place; POST upserts on this.
  UNIQUE (user_id, place_id)
);
CREATE INDEX IF NOT EXISTS idx_recommendations_place ON recommendations (place_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_user ON recommendations (user_id);

-- Photos --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS photos (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  place_id          uuid NOT NULL REFERENCES places (id) ON DELETE CASCADE,
  recommendation_id uuid REFERENCES recommendations (id) ON DELETE SET NULL,
  image_url         text,
  storage_path      text,
  caption           text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  CHECK (image_url IS NOT NULL OR storage_path IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_photos_place ON photos (place_id);
CREATE INDEX IF NOT EXISTS idx_photos_recommendation ON photos (recommendation_id);

-- Recommendation <-> ReasonTag join -----------------------------------------
CREATE TABLE IF NOT EXISTS recommendation_reason_tags (
  recommendation_id uuid NOT NULL REFERENCES recommendations (id) ON DELETE CASCADE,
  reason_tag_id     uuid NOT NULL REFERENCES reason_tags (id) ON DELETE CASCADE,
  PRIMARY KEY (recommendation_id, reason_tag_id)
);

-- Follows (social graph edge) -----------------------------------------------
CREATE TABLE IF NOT EXISTS follows (
  follower_user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  followed_user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_user_id, followed_user_id),
  CHECK (follower_user_id <> followed_user_id)
);

-- Saves ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS saves (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  place_id   uuid NOT NULL REFERENCES places (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, place_id)
);
CREATE INDEX IF NOT EXISTS idx_saves_user ON saves (user_id);

-- updated_at triggers -------------------------------------------------------
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_places_updated_at ON places;
CREATE TRIGGER trg_places_updated_at BEFORE UPDATE ON places
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_recommendations_updated_at ON recommendations;
CREATE TRIGGER trg_recommendations_updated_at BEFORE UPDATE ON recommendations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
