-- update version
PRAGMA user_version = 2;

-- Add `meta` table
CREATE TABLE IF NOT EXISTS meta (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  created_at integer NOT NULL DEFAULT (CAST(strftime('%s','now') as integer) * 1000),
  modified_at integer NOT NULL DEFAULT (CAST(strftime('%s','now') as integer) * 1000),
  entity_id integer NOT NULL,
  type text NOT NULL,
  key text NOT NULL,
  value text NOT NULL
);
