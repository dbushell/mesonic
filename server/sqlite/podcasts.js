// Podcasts
import * as log from 'log';
import * as csv from 'csv';
import {parseOptions, sqlf} from './utils.js';
import {execQuery, runQuery} from './mod.js';

const textDecoder = new TextDecoder();

// Query and parse `podcasts` table
export const getPodcasts = async ({key, value} = {}) => {
  try {
    let query =
      'SELECT `podcasts`.*,\
      (SELECT COUNT(*) FROM `episodes` WHERE `podcast_id`=`podcasts`.`id`) AS `episode_count`\
      FROM `podcasts`';
    if (key && value) {
      const t = typeof value === 'number' ? 'd' : 's';
      query += sqlf(' WHERE `podcasts`.`%s`=%' + t + ' LIMIT 1', {key}, value);
    }
    if (!query.includes('LIMIT 1')) {
      query += ' ORDER BY datetime(`podcasts`.`modified_at`) DESC';
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

// Get single podcast data
export const getPodcastBy = async (key, value) =>
  (await getPodcasts({key, value}))[0];

// Update podcast data
export const updatePodcast = (data) =>
  execQuery(
    sqlf(
      'UPDATE `podcasts`\
      SET `modified_at`=%s,`url`=%s,`name`=%s\
      WHERE `id`=%d LIMIT 1',
      data.modified_at.toISOString(),
      data.url,
      data.name,
      data.id
    )
  );

// Insert podcast data
export const insertPodcast = (data) =>
  execQuery(
    sqlf(
      'INSERT INTO `podcasts` (`modified_at`,`url`,`name`) VALUES (%s,%s,%s)',
      new Date(0).toISOString(),
      data.url,
      data.name
    )
  );

// Delete podcast data
export const deletePodcast = async ({id}) => {
  log.warning(`Removing podcast: ${id}`);
  await execQuery(sqlf('DELETE FROM `podcasts` WHERE `id`=%d LIMIT 1', id));
};
