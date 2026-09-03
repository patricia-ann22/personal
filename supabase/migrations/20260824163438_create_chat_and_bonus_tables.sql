/*
# Create chat and bonus points tables for two-person private app

1. New Tables
- `messages`
  - `id` (uuid, primary key)
  - `sender` (text, not null) — either 'emerald' or 'tough_honey'
  - `content` (text, nullable) — text message body
  - `media_url` (text, nullable) — public URL of uploaded image/video in storage
  - `media_type` (text, nullable) — 'image' or 'video'
  - `created_at` (timestamptz, default now())
- `bonus_points`
  - `id` (uuid, primary key)
  - `giver` (text, not null) — who gave the points ('emerald' or 'tough_honey')
  - `receiver` (text, not null) — who received the points
  - `points` (integer, not null) — positive or negative
  - `reason` (text, nullable) — reason for the points
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on both tables.
- This is a no-auth two-person app (password gate is client-side only, not Supabase auth).
- Use TO anon, authenticated with USING (true) since data is intentionally shared between the two users.
- Storage bucket 'media' is public for reads; inserts allowed for anon.

3. Notes
- No user_id / auth.uid() since there is no Supabase auth — login is a simple password gate.
- Both users share all data; this is by design for a private two-person app.
*/

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender text NOT NULL CHECK (sender IN ('emerald', 'tough_honey')),
  content text,
  media_url text,
  media_type text CHECK (media_type IN ('image', 'video')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_messages" ON messages;
CREATE POLICY "anon_select_messages" ON messages FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_messages" ON messages;
CREATE POLICY "anon_insert_messages" ON messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_messages" ON messages;
CREATE POLICY "anon_update_messages" ON messages FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_messages" ON messages;
CREATE POLICY "anon_delete_messages" ON messages FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS bonus_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  giver text NOT NULL CHECK (giver IN ('emerald', 'tough_honey')),
  receiver text NOT NULL CHECK (receiver IN ('emerald', 'tough_honey')),
  points integer NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bonus_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_bonus" ON bonus_points;
CREATE POLICY "anon_select_bonus" ON bonus_points FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_bonus" ON bonus_points;
CREATE POLICY "anon_insert_bonus" ON bonus_points FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_bonus" ON bonus_points;
CREATE POLICY "anon_update_bonus" ON bonus_points FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_bonus" ON bonus_points;
CREATE POLICY "anon_delete_bonus" ON bonus_points FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at);
CREATE INDEX IF NOT EXISTS idx_bonus_receiver ON bonus_points (receiver);
CREATE INDEX IF NOT EXISTS idx_bonus_created_at ON bonus_points (created_at);

-- Storage bucket for media uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "anon_upload_media" ON storage.objects;
CREATE POLICY "anon_upload_media" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "anon_read_media" ON storage.objects;
CREATE POLICY "anon_read_media" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'media');

DROP POLICY IF EXISTS "anon_delete_media" ON storage.objects;
CREATE POLICY "anon_delete_media" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'media');
