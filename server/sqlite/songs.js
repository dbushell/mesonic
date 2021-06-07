// Songs
import * as log from 'log';
import * as csv from 'csv';
import {parseOptions, sqlf} from './utils.js';
import {execQuery, runQuery} from './mod.js';

const textDecoder = new TextDecoder();

export const countSongs = async () => {
  try {
    return Number.parseInt(
      textDecoder.decode(
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
export const getSongs = async ({artist_id, album_id, key, value} = {}) => {
  try {
    let query = 'SELECT * FROM `songs`';
    if (key && value) {
      const t = typeof value === 'number' ? 'd' : 's';
      query += sqlf(' WHERE `%s`=%' + t, {key}, value);
    }
    if (artist_id) {
      query += query.includes('WHERE') ? ' AND' : ' WHERE';
      query += sqlf(' `artist_id`=%d', artist_id);
    }
    if (album_id) {
      query += query.includes('WHERE') ? ' AND' : ' WHERE';
      query += sqlf(' `album_id`=%d', album_id);
    }
    if (key && value) {
      query += ' LIMIT 1';
    } else {
      query += ' ORDER BY `songs`.`name` ASC';
    }
    const data = textDecoder.decode(await runQuery(query));
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
export const getSongBy = async (key, value, artist_id = 0, album_id = 0) =>
  (await getSongs({artist_id, album_id, key, value}))[0];

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

// Delete song data
export const deleteSong = async ({id, path}) => {
  log.warning(`Removing song: ${path}`);
  await execQuery(sqlf('DELETE FROM `songs` WHERE `id`=%d LIMIT 1', id));
};

// Delete songs with missing artist or album
export const deleteSongOrphans = async () => {
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
};
