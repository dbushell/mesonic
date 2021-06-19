// Albums
import * as log from 'log';
import * as csv from 'csv';
import {parseOptions, sqlf} from './utils.js';
import {execQuery, runQuery} from './mod.js';

const textDecoder = new TextDecoder();

// Query and parse `albums` table
export const getAlbums = async ({artist_id, key, value} = {}) => {
  try {
    let query =
      'SELECT `albums`.*,\
       (SELECT COUNT(*) FROM `songs` WHERE `album_id`=`albums`.`id`) AS `song_count`,\
       (SELECT SUM(`duration`) FROM `songs` WHERE `album_id`=`albums`.`id`) AS `duration`\
       FROM `albums`';
    let where = false;
    if (key && value) {
      const t = typeof value === 'number' ? 'd' : 's';
      query += sqlf(' WHERE `albums`.`%s`=%' + t, {key}, value);
      where = true;
    }
    if (artist_id) {
      query += where ? ' AND' : ' WHERE';
      query += sqlf(' `albums`.`artist_id`=%d', artist_id);
    }
    if (key && value) {
      query += ' LIMIT 1';
    } else {
      query += ' ORDER BY `albums`.`name` ASC';
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

// Get single album data
export const getAlbumBy = async (key, value, artist_id = 0) =>
  (await getAlbums({artist_id, key, value}))[0];

// Update album data
export const updateAlbum = (data) =>
  execQuery(
    sqlf(
      'UPDATE `albums`\
      SET `modified_at`=%s,`artist_id`=%d,`name`=%s,`path`=%s\
      WHERE `id`=%d LIMIT 1',
      new Date().toISOString(),
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
      'INSERT INTO `albums` (`artist_id`,`name`,`path`) VALUES (%d,%s,%s)',
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

// Delete albums with missing artist
export const deleteAlbumOrphans = async () => {
  await execQuery(
    'DELETE FROM `albums` WHERE `artist_id` IN\
      (SELECT `albums`.`artist_id` FROM `albums`\
      LEFT JOIN `artists` ON `albums`.`artist_id`=`artists`.`id`\
      WHERE `artists`.`id` IS NULL)'
  );
};
