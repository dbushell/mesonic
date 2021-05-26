// Sqlite
import * as log from 'log';
import * as csv from 'csv';
import {Queue, sqlf} from './utils.js';
import {DEV, DATABASE} from './constants.js';

// Limit queries to avoid locked database
const queries = new Queue();

// Return CSV formatted data from an SQLite query
export const runQuery = async (sql, args = {readonly: true, header: true}) => {
  return queries.push(async () => {
    if (DEV) {
      log.info(sql.replace(/\s+/g, ' '));
    }
    const cmd = ['sqlite3'];
    if (args.readonly !== false) {
      cmd.push('-readonly');
      cmd.push('-csv');
      if (args.header) {
        cmd.push('-header');
      }
    }
    const process = Deno.run({
      cmd: [...cmd, DATABASE, sql],
      stdout: 'piped',
      stderr: 'piped'
    });
    const [status, stdout, stderr] = await Promise.all([
      process.status(),
      process.output(),
      process.stderrOutput()
    ]);
    process.close();
    if (!status.success) {
      throw new Error(new TextDecoder().decode(stderr));
    }
    return stdout;
  });
};

// Execute write query
export const execQuery = async (query) => {
  try {
    await runQuery(query, {readonly: false});
    return true;
  } catch (err) {
    log.error(err);
    return false;
  }
};

// CSV parsing options to convert integers
const parseOptions = {
  skipFirstRow: true,
  parse: (item) => {
    for (const [key, value] of Object.entries(item)) {
      if (!['path', 'name'].includes(key)) {
        item[key] = isNaN(value) ? value : Number.parseInt(value, 10);
      }
    }
    return item;
  }
};

// Query and parse `artists` table
export const getArtists = async (artist_id = 0) => {
  try {
    let query =
      'SELECT `artists`.*,\
      (SELECT COUNT(*) FROM `albums` WHERE `artist_id`=`artists`.`id`) AS `album_count`,\
      (SELECT COUNT(*) FROM `songs` WHERE `artist_id`=`artists`.`id`) AS `song_count`\
      FROM `artists`';
    if (artist_id) {
      query += sqlf(' WHERE `artists`.`id`=%d LIMIT 1', artist_id);
    } else {
      query += ' ORDER BY `artists`.`name` ASC';
    }
    const data = new TextDecoder().decode(await runQuery(query));
    if (!data.trim()) {
      return [];
    }
    return await csv.parse(data, parseOptions);
  } catch (err) {
    log.error(err);
    return [];
  }
};

// Get single artist data
export const getArtistByKeyValue = async (key, value) => {
  let artists = [];
  if (key === 'id') {
    artists = await getArtists(value);
  } else {
    artists = await getArtists();
  }
  return artists.find((artist) => artist[key] === value);
};

// Update artist data
export const updateArtist = (data) =>
  execQuery(
    sqlf(
      'UPDATE `artists`\
      SET `modified_at`=%d,`name`=%s,`path`=%s\
      WHERE `id`=%d LIMIT 1',
      Date.now(),
      data.name,
      data.path,
      data.id
    )
  );

// Insert artist data
export const insertArtist = (data) =>
  execQuery(
    sqlf(
      'INSERT INTO `artists`\
      (`created_at`,`modified_at`,`name`,`path`)\
      VALUES (%d,%d,%s,%s)',
      Date.now(),
      Date.now(),
      data.name,
      data.path
    )
  );

// Delete artist data
export const deleteArtist = async ({id, path}) => {
  log.warning(`Removing artist: ${path}`);
  await execQuery(sqlf('DELETE FROM `artists` WHERE `id`=%d LIMIT 1', id));
};

// Query and parse `albums` table
export const getAlbums = async (artist_id = 0, album_id = 0) => {
  try {
    let query =
      'SELECT `albums`.*,\
       (SELECT COUNT(*) FROM `songs` WHERE `album_id`=`albums`.`id`) AS `song_count`,\
       (SELECT SUM(`duration`) FROM `songs` WHERE `album_id`=`albums`.`id`) AS `duration`\
       FROM `albums`';
    if (album_id) {
      query += sqlf(' WHERE `albums`.`id`=%d LIMIT 1', album_id);
    } else if (artist_id) {
      query += sqlf(' WHERE `albums`.`artist_id`=%d', artist_id);
    }
    if (!album_id) {
      query += ' ORDER BY `albums`.`name` ASC';
    }
    const data = new TextDecoder().decode(await runQuery(query));
    if (!data.trim()) {
      return [];
    }
    return await csv.parse(data, parseOptions);
  } catch (err) {
    log.error(err);
    return [];
  }
};

// Get single album data
export const getAlbumByKeyValue = async (key, value, artist_id = 0) => {
  let albums = [];
  if (key === 'id') {
    albums = await getAlbums(0, value);
  } else {
    albums = await getAlbums(artist_id);
  }
  return albums.find((album) => album[key] === value);
};

// Update album data
export const updateAlbum = (data) =>
  execQuery(
    sqlf(
      'UPDATE `albums`\
      SET `modified_at`=%d,`artist_id`=%d,`name`=%s,`path`=%s\
      WHERE `id`=%d LIMIT 1',
      Date.now(),
      data.artist_id,
      data.name,
      data.path,
      data.id
    )
  );

// Insert album data
export const insertAlbum = (data) =>
  execQuery(
    sqlf(
      'INSERT INTO `albums`\
      (`created_at`,`modified_at`,`artist_id`,`name`,`path`)\
      VALUES (%d,%d,%d,%s,%s)',
      Date.now(),
      Date.now(),
      data.artist_id,
      data.name,
      data.path
    )
  );

// Delete album data
export const deleteAlbum = async ({id, path}) => {
  log.warning(`Removing album: ${path}`);
  await execQuery(sqlf('DELETE FROM `albums` WHERE `id`=%d LIMIT 1', id));
};

export const countSongs = async () => {
  try {
    return Number.parseInt(
      new TextDecoder().decode(
        await runQuery('SELECT COUNT (*) FROM songs', {header: false})
      ),
      10
    );
  } catch (err) {
    log.error(err);
    return 0;
  }
};

// Query and parse `songs` table
export const getSongs = async (artist_id = 0, album_id = 0, song_id = 0) => {
  try {
    let query = 'SELECT * FROM `songs`';
    if (song_id) {
      query += sqlf(' WHERE `id`=%d LIMIT 1', song_id);
    } else if (artist_id && album_id) {
      query += sqlf(
        ' WHERE `artist_id`=%d AND `album_id`=%d',
        artist_id,
        album_id
      );
    } else if (artist_id) {
      query += sqlf(' WHERE `artist_id`=%d', artist_id);
    } else if (album_id) {
      query += sqlf(' WHERE `album_id`=%d', album_id);
    }
    if (!song_id) {
      query += ' ORDER BY `songs`.`name` ASC';
    }
    const data = new TextDecoder().decode(await runQuery(query));
    if (!data.trim()) {
      return [];
    }
    return await csv.parse(data, parseOptions);
  } catch (err) {
    log.error(err);
    return [];
  }
};

// Get single song data
export const getSongByKeyValue = async (
  key,
  value,
  artist_id = 0,
  album_id = 0
) => {
  let songs = [];
  if (key === 'id') {
    songs = await getSongs(0, 0, value);
  } else {
    songs = await getSongs(artist_id, album_id);
  }
  return songs.find((song) => song[key] === value);
};

// Update song data
export const updateSong = (data) =>
  execQuery(
    sqlf(
      'UPDATE `songs`\
      SET `modified_at`=%d,`artist_id`=%d,`album_id`=%d,`name`=%s,`path`=%s\
      WHERE `id`=%d LIMIT 1',
      Date.now(),
      data.artist_id,
      data.album_id,
      data.name,
      data.path,
      data.id
    )
  );

// Update song metadata
export const updateSongMeta = (data) =>
  execQuery(
    sqlf(
      'UPDATE `songs`\
      SET `modified_at`=%d,`duration`=%d,`bitrate`=%d,`size`=%d,`codec`=%s\
      WHERE `id`=%d LIMIT 1',
      Date.now(),
      data.duration,
      data.bitrate,
      data.size,
      data.codec,
      data.id
    )
  );

// Insert song data
export const insertSong = (data) =>
  execQuery(
    sqlf(
      'INSERT INTO `songs`\
      (`created_at`,`modified_at`,`artist_id`,`album_id`,`name`,`path`,`duration`,`bitrate`,`size`,`codec`)\
      VALUES (%d,%d,%d,%d,%s,%s,0,0,0,"")',
      Date.now(),
      Date.now(),
      data.artist_id,
      data.album_id,
      data.name,
      data.path
    )
  );

// Delete song data
export const deleteSong = async ({id, path}) => {
  log.warning(`Removing song: ${path}`);
  await execQuery(sqlf('DELETE FROM `songs` WHERE `id`=%d LIMIT 1', id));
};

// Query and parse `bookmarks` table
export const getBookmarks = async () => {
  try {
    const data = new TextDecoder().decode(
      await runQuery(
        'SELECT `bookmarks`.*\
        FROM `bookmarks`\
        ORDER BY `bookmarks`.`modified_at` DESC\
        LIMIT 100'
      )
    );
    if (!data.trim()) {
      return [];
    }
    return await csv.parse(data, parseOptions);
  } catch (err) {
    log.error(err);
    return [];
  }
};

// Get single bookmark data
export const getBookmarkByKeyValue = (key, value) =>
  getBookmarks().then((bookmarks) =>
    bookmarks.find((bookmark) => bookmark[key] === value)
  );

// Update bookmark data
export const updateBookmark = (data) =>
  execQuery(
    sqlf(
      'UPDATE `bookmarks`\
      SET `modified_at`=%d,`song_id`=%d,`position`=%d,`comment`=%s\
      WHERE `id`=%d LIMIT 1',
      Date.now(),
      data.song_id,
      data.position,
      data.comment,
      data.id
    )
  );

// Insert bookmark data
export const insertBookmark = (data) =>
  execQuery(
    sqlf(
      'INSERT INTO `bookmarks`\
      (`created_at`,`modified_at`,`song_id`,`position`,`comment`)\
      VALUES (%d,%d,%d,%d,%s)',
      Date.now(),
      Date.now(),
      data.song_id,
      data.position,
      data.comment
    )
  );

// Delete bookmark data
export const deleteBookmark = async (id, is_song = false) => {
  if (is_song) {
    await execQuery(sqlf('DELETE FROM `bookmarks` WHERE `song_id`=%d', id));
  } else {
    await execQuery(sqlf('DELETE FROM `bookmarks` WHERE `id`=%d LIMIT 1', id));
  }
};

// Delete orphans
export const deleteOrphans = async () => {
  await execQuery(
    'DELETE FROM `albums` WHERE `artist_id` IN\
    (SELECT `albums`.`artist_id` FROM `albums`\
    LEFT JOIN `artists` ON `albums`.`artist_id`=`artists`.`id`\
    WHERE `artists`.`id` IS NULL)'
  );
  await execQuery(
    'DELETE FROM `songs` WHERE `artist_id` IN\
    (SELECT `songs`.`artist_id` FROM `songs`\
    LEFT JOIN `artists` ON `songs`.`artist_id`=`artists`.`id`\
    WHERE `artists`.`id` IS NULL)'
  );
  await execQuery(
    'DELETE FROM `songs` WHERE `album_id` IN\
    (SELECT `songs`.`album_id` FROM `songs`\
    LEFT JOIN `albums` ON `songs`.`album_id`=`albums`.`id`\
    WHERE `albums`.`id` IS NULL)'
  );
  await execQuery(
    'DELETE FROM `bookmarks` WHERE `song_id`\
    IN (SELECT `bookmarks`.`song_id` FROM `bookmarks`\
    LEFT JOIN `songs` ON `bookmarks`.`song_id`=`songs`.`id`\
    WHERE `songs`.`id` IS NULL)'
  );
};
