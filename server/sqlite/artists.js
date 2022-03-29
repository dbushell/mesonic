// Artists
import * as log from 'log';
import * as csv from 'csv';
import {parseOptions, sqlf} from './utils.js';
import {execQuery, runQuery} from './mod.js';

const textDecoder = new TextDecoder();

// Query and parse `artists` table
export const getArtists = async ({key, value} = {}) => {
  try {
    let query =
      'SELECT `artists`.*,\
      (SELECT COUNT(*) FROM `albums` WHERE `artist_id`=`artists`.`id`) AS `album_count`,\
      (SELECT COUNT(*) FROM `songs` WHERE `artist_id`=`artists`.`id`) AS `song_count`\
      FROM `artists`';
    if (key && value) {
      const t = typeof value === 'number' ? 'd' : 's';
      query += sqlf(' WHERE `artists`.`%s`=%' + t + ' LIMIT 1', {key}, value);
    }
    if (!query.includes('LIMIT 1')) {
      query += ' ORDER BY `artists`.`name` ASC';
    }
    const data = textDecoder.decode(await runQuery(query));
    if (!data.trim()) {
      return [];
    }
    return (await csv.parse(data, parseOptions)).map(parseOptions.parse);
  } catch (err) {
    log.error(err);
    return [];
  }
};

// Get single artist data
export const getArtistBy = async (key, value) =>
  (await getArtists({key, value}))[0];

// Update artist data
export const updateArtist = (data) =>
  execQuery(
    sqlf(
      'UPDATE `artists`\
      SET `modified_at`=%s,`name`=%s,`path`=%s\
      WHERE `id`=%d LIMIT 1',
      new Date().toISOString(),
      data.name,
      data.path,
      data.id
    )
  );

// Insert artist data
export const insertArtist = (data) =>
  execQuery(
    sqlf(
      'INSERT INTO `artists` (`name`,`path`) VALUES (%s,%s)',
      data.name,
      data.path
    )
  );

// Delete artist data
export const deleteArtist = async ({id, path}) => {
  log.warning(`Removing artist: ${path}`);
  await execQuery(sqlf('DELETE FROM `artists` WHERE `id`=%d LIMIT 1', id));
};
