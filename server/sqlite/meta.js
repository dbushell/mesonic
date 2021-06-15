// Meta
import * as log from 'log';
import * as csv from 'csv';
import {parseOptions, sqlf} from './utils.js';
import {execQuery, runQuery} from './mod.js';

const textDecoder = new TextDecoder();

// Query and parse `meta` table
export const getMeta = async ({ids}) => {
  try {
    ids = ids.map(Number).join(',');
    let query = 'SELECT `entity_id`,`key`,`value` FROM `meta`';
    query += `WHERE \`entity_id\` IN (${ids})`;
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

// Insert episode data
export const insertMeta = (data) => {
  return execQuery(
    sqlf(
      'INSERT OR REPLACE INTO `meta`\
      (`id`,`created_at`,`modified_at`,`entity_id`,`type`,`key`,`value`)\
      VALUES (%s,%s,%d,%d,%s,%s,%s)',
      () =>
        sqlf(
          '(SELECT `id` FROM `meta` WHERE `entity_id`=%d AND `key`=%s)',
          data.entity_id,
          data.key
        ),
      () =>
        sqlf(
          '(SELECT `created_at` FROM `meta` WHERE `entity_id`=%d AND `key`=%s)',
          data.entity_id,
          data.key
        ),
      Date.now(),
      data.entity_id,
      data.type,
      data.key,
      String(data.value)
    )
  );
};

// Delete meta with missing episodes
export const deleteMetaOrphans = async () => {
  await execQuery(
    'DELETE FROM `meta` WHERE `type`="episode" AND `entity_id`\
    IN (SELECT `meta`.`entity_id` FROM `meta`\
    LEFT JOIN `episodes` ON `meta`.`entity_id`=`episodes`.`id`\
    WHERE `episodes`.`id` IS NULL)'
  );
};
