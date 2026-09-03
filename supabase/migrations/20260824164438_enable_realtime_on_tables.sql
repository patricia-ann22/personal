/*
# Enable realtime on messages and bonus_points tables

1. Changes
- Add `messages` table to the `supabase_realtime` publication so INSERT events are broadcast.
- Add `bonus_points` table to the `supabase_realtime` publication so INSERT events are broadcast.

2. Notes
- Without this, the frontend's `.channel().on('postgres_changes', ...)` subscriptions receive no events.
- Uses a DO block to safely add tables only if not already present.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'bonus_points'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE bonus_points;
  END IF;
END $$;
