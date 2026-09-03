-- Schema for the personal chat + bonus points + memories app.
-- This is plain SQL (Postgres-flavored) and is intentionally database-agnostic:
-- no vendor-specific auth, RLS, realtime publications, or storage buckets.
-- Adapt types (uuid, timestamptz) to your database of choice as needed.

-- ---------------------------------------------------------------------------
-- messages: chat messages between the two users, with optional media
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender     text NOT NULL CHECK (sender IN ('emerald', 'tough_honey')),
  content    text,
  media_url  text,
  media_type text CHECK (media_type IN ('image', 'video')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at);

-- ---------------------------------------------------------------------------
-- bonus_points: points log between the two users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bonus_points (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  giver      text NOT NULL CHECK (giver    IN ('emerald', 'tough_honey')),
  receiver   text NOT NULL CHECK (receiver IN ('emerald', 'tough_honey')),
  points     integer NOT NULL,
  reason     text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bonus_receiver   ON bonus_points (receiver);
CREATE INDEX IF NOT EXISTS idx_bonus_created_at ON bonus_points (created_at);

-- ---------------------------------------------------------------------------
-- memories: Memory Lane entries with optional media
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS memories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator     text NOT NULL CHECK (creator IN ('emerald', 'tough_honey')),
  title       text NOT NULL,
  description text,
  memory_date date NOT NULL,
  media_url   text,
  media_type  text CHECK (media_type IN ('image', 'video')),
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_memories_date ON memories (memory_date);
