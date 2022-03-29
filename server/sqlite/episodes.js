// Episodes
import * as log from 'log';
import * as csv from 'csv';
import {parseOptions, sqlf} from './utils.js';
import {getMeta, execQuery, runQuery} from './mod.js';

const textDecoder = new TextDecoder();

// Query and parse `episodes` table
export const getEpisodes = async ({podcast_id, meta, key, value}) => {
  try {
    let query = 'SELECT * FROM `episodes`';
    if (key && value) {
      const t = typeof value === 'number' ? 'd' : 's';
      query += sqlf(' WHERE `%s`=%' + t, {key}, value);
    }
    if (podcast_id) {
      query += query.includes('WHERE') ? ' AND' : ' WHERE';
      query += sqlf(' `podcast_id`=%d', podcast_id);
    }
    if (key && value) {
      query += ' LIMIT 1';
    } else {
      query += ' ORDER BY datetime(`episodes`.`modified_at`) DESC';
    }
    const data = textDecoder.decode(await runQuery(query));
    if (!data.trim()) {
      return [];
    }
    const episodes = await csv.parse(data, parseOptions);
    episodes.map(parseOptions.parse);
    if (meta) {
      const meta_map = {};
      const ids = episodes.map((episode) => episode.id);
      (await getMeta({ids})).forEach((meta) => {
        const entity = meta_map[meta.entity_id] ?? {};
        entity[meta.key] = meta.value;
        meta_map[meta.entity_id] = entity;
      });
      episodes.forEach((episode) => {
        if (episode.id in meta_map) {
          episode.meta = meta_map[episode.id];
        }
      });
    }
    return episodes;
  } catch (err) {
    log.error(err);
    return [];
  }
};

// Get single episode data
export const getEpisodeBy = async (key, value, podcast_id = 0) =>
  (await getEpisodes({podcast_id, key, value}))[0];

// Insert episode data
export const insertEpisode = (data) =>
  execQuery(
    sqlf(
      'INSERT INTO `episodes`\
      (`modified_at`,`podcast_id`,`url`,`name`,`path`,`duration`,`size`)\
      VALUES (%s,%d,%s,%s,%s,%d,%d)',
      data.modified_at.toISOString(),
      data.podcast_id,
      data.url,
      data.name,
      data.path,
      data.duration,
      data.size
    )
  );

// Delete episode data
export const deleteEpisode = async ({id, path}) => {
  log.warning(`Removing episode: ${path}`);
  if (id) {
    return execQuery(sqlf('DELETE FROM `episodes` WHERE `id`=%d LIMIT 1', id));
  } else if (path) {
    await execQuery(
      sqlf('DELETE FROM `episodes` WHERE `path`=%s LIMIT 1', path)
    );
  }
};

// Delete episodes with missing podcast
export const deleteEpisodeOrphans = async () => {
  await execQuery(
    'DELETE FROM `episodes` WHERE `podcast_id` IN\
    (SELECT `episodes`.`podcast_id` FROM `episodes`\
    LEFT JOIN `podcasts` ON `episodes`.`podcast_id`=`podcasts`.`id`\
    WHERE `podcasts`.`id` IS NULL)'
  );
};
