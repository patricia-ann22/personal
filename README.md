# Personal project

## Database

This repo does not ship with any database client or connection code. Bring
your own database — Postgres, MySQL, SQLite, or anything else — and wire it
up however you prefer.

### Schema

The complete schema lives in a single file:

- [`db/schema.sql`](db/schema.sql)

It defines three tables:

- `messages` — chat messages (text and optional media)
- `bonus_points` — bonus points log between the two users
- `memories` — Memory Lane entries with optional media

The SQL is written in a Postgres-flavored dialect but is intentionally
vendor-neutral: no auth, no row-level security, no realtime, no storage
buckets. Adapt types (`uuid`, `timestamptz`, `gen_random_uuid()`) to your
target database if needed.

### How to connect

1. Provision a database of your choice.
2. Run `db/schema.sql` against it to create the tables.
3. Decide how you want media uploads to work (object storage, local disk,
   a `bytea` column, etc.) and store the resulting URL in `media_url`.
4. Install a client library for your database and create your own module
   under `lib/` that exports whatever the app components need.

That's it — no specific provider is required.

