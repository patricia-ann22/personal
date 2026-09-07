
CREATE TABLE IF NOT EXISTS messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender     text NOT NULL CHECK (sender IN ('cutie', 'tough_honey')),
  content    text,
  media_url  text,
  media_type text CHECK (media_type IN ('image', 'video')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at);


CREATE TABLE IF NOT EXISTS bonus_points (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  giver      text NOT NULL CHECK (giver    IN ('cutie', 'tough_honey')),
  receiver   text NOT NULL CHECK (receiver IN ('cutie', 'tough_honey')),
  points     integer NOT NULL,
  reason     text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bonus_receiver   ON bonus_points (receiver);
CREATE INDEX IF NOT EXISTS idx_bonus_created_at ON bonus_points (created_at);


CREATE TABLE IF NOT EXISTS memories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator     text NOT NULL CHECK (creator IN ('cutie', 'tough_honey')),
  title       text NOT NULL,
  description text,
  memory_date date NOT NULL,
  media_url   text,
  media_type  text CHECK (media_type IN ('image', 'video')),
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_memories_date ON memories (memory_date);
