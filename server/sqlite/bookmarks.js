// Bookmarks
import * as log from 'log';
import * as csv from 'csv';
import {parseOptions, sqlf} from './utils.js';
import {execQuery, runQuery} from './mod.js';

const textDecoder = new TextDecoder();

// Query and parse `bookmarks` table
export const getBookmarks = async () => {
  try {
    const data = textDecoder.decode(
      await runQuery(
        'SELECT `bookmarks`.*\
        FROM `bookmarks`\
        ORDER BY datetime(`bookmarks`.`modified_at`) DESC\
        LIMIT 100'
      )
    );
    if (!data.trim()) {
      return [];
    }
    return (await csv.parse(data, parseOptions)).map(parseOptions.parse);
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

// Insert bookmark data
export const insertBookmark = async (data) => {
  await execQuery(
    sqlf(
      'INSERT INTO `bookmarks`\
      (`entity_id`,`type`,`position`,`comment`)\
      VALUES (%d,%s,%d,%s)',
      data.entity_id,
      data.type,
      data.position,
      data.comment
    )
  );
};

// Delete bookmark data
export const deleteBookmark = async (id, type = 'song') => {
  if (type === 'bookmark') {
    await execQuery(sqlf('DELETE FROM `bookmarks` WHERE `id`=%d LIMIT 1', id));
  } else {
    await execQuery(
      sqlf(
        'DELETE FROM `bookmarks` WHERE `entity_id`=%d AND `type`=%s',
        id,
        type
      )
    );
  }
};

// Delete bookmarks with missing song or episode
export const deleteBookmarkOrphans = async () => {
  await execQuery(
    'DELETE FROM `bookmarks` WHERE `type`="song" AND `entity_id`\
      IN (SELECT `bookmarks`.`entity_id` FROM `bookmarks`\
      LEFT JOIN `songs` ON `bookmarks`.`entity_id`=`songs`.`id`\
      WHERE `songs`.`id` IS NULL)'
  );
  await execQuery(
    'DELETE FROM `bookmarks` WHERE `type`="episode" AND `entity_id`\
      IN (SELECT `bookmarks`.`entity_id` FROM `bookmarks`\
      LEFT JOIN `episodes` ON `bookmarks`.`entity_id`=`episodes`.`id`\
      WHERE `episodes`.`id` IS NULL)'
  );
};
