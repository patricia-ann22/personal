/*
# Create memories table for Memory Lane feature

1. New Table
- `memories`
  - `id` (uuid, primary key)
  - `creator` (text, not null) — who created the memory ('emerald' or 'tough_honey')
  - `title` (text, not null) — title for the memory
  - `description` (text, nullable) — optional description
  - `memory_date` (date, not null) — the day this memory is about
  - `media_url` (text, nullable) — public URL of uploaded image/video
  - `media_type` (text, nullable) — 'image' or 'video'
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS, same pattern as other tables — shared data for two-person app.
- TO anon, authenticated with USING (true) since data is intentionally shared.

3. Notes
- Uses the existing 'media' storage bucket for uploads.
*/

CREATE TABLE IF NOT EXISTS memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator text NOT NULL CHECK (creator IN ('emerald', 'tough_honey')),
  title text NOT NULL,
  description text,
  memory_date date NOT NULL,
  media_url text,
  media_type text CHECK (media_type IN ('image', 'video')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_memories" ON memories;
CREATE POLICY "anon_select_memories" ON memories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_memories" ON memories;
CREATE POLICY "anon_insert_memories" ON memories FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_memories" ON memories;
CREATE POLICY "anon_delete_memories" ON memories FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_memories_date ON memories (memory_date);

-- Enable realtime on memories table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'memories'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE memories;
  END IF;
END $$;
