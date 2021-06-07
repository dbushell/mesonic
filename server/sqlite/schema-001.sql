-- update version
PRAGMA user_version = 1;

-- Add `bookmarks.type` column
ALTER TABLE bookmarks RENAME COLUMN song_id TO entity_id;
ALTER TABLE bookmarks ADD type text NULL;

-- Add `podcasts` table
CREATE TABLE IF NOT EXISTS podcasts (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  created_at integer NOT NULL,
  modified_at integer NOT NULL,
  url text NOT NULL,
  name text NOT NULL
);

-- Add `episodes` table
CREATE TABLE IF NOT EXISTS episodes (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  created_at integer NOT NULL,
  modified_at integer NOT NULL,
  podcast_id integer NOT NULL,
  url text NOT NULL,
  name text NOT NULL,
  path text NOT NULL,
  duration integer NOT NULL,
  size integer NOT NULL
);
