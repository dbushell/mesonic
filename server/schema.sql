CREATE TABLE songs (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  created_at integer NOT NULL,
  modified_at integer NOT NULL,
  artist_id integer NOT NULL,
  album_id integer NOT NULL,
  name text NOT NULL,
  path text NOT NULL,
  duration integer NOT NULL,
  bitrate integer NOT NULL,
  size integer NOT NULL,
  codec text NOT NULL
);
CREATE TABLE albums (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  created_at integer NOT NULL,
  modified_at integer NOT NULL,
  artist_id integer NOT NULL,
  name text NOT NULL,
  path text NOT NULL
);
CREATE TABLE artists (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  created_at integer NOT NULL,
  modified_at integer NOT NULL,
  name text NOT NULL,
  path text NOT NULL
);
CREATE TABLE bookmarks (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  created_at integer NOT NULL,
  modified_at integer NOT NULL,
  song_id integer NOT NULL,
  position integer NOT NULL,
  comment text NOT NULL
);
