-- update version
PRAGMA user_version = 0;

CREATE TABLE IF NOT EXISTS songs (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  created_at text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  modified_at text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  artist_id integer NOT NULL,
  album_id integer NOT NULL,
  name text NOT NULL,
  path text NOT NULL,
  duration integer NOT NULL,
  bitrate integer NOT NULL,
  size integer NOT NULL,
  codec text NOT NULL
);

CREATE TABLE IF NOT EXISTS albums (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  created_at text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  modified_at text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  artist_id integer NOT NULL,
  name text NOT NULL,
  path text NOT NULL
);

CREATE TABLE IF NOT EXISTS artists (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  created_at text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  modified_at text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  name text NOT NULL,
  path text NOT NULL
);

CREATE TABLE IF NOT EXISTS podcasts (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  created_at text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  modified_at text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  url text NOT NULL,
  name text NOT NULL
);

CREATE TABLE IF NOT EXISTS episodes (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  created_at text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  modified_at text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  podcast_id integer NOT NULL,
  url text NOT NULL,
  name text NOT NULL,
  path text NOT NULL,
  duration integer NOT NULL,
  size integer NOT NULL
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  created_at text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  modified_at text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  entity_id integer NOT NULL,
  type text NULL,
  position integer NOT NULL,
  comment text NOT NULL
);

CREATE TABLE IF NOT EXISTS meta (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  created_at text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  modified_at text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  entity_id integer NOT NULL,
  type text NULL,
  key text NOT NULL,
  value text NOT NULL
);
