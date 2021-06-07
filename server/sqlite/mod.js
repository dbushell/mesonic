// Sqlite
import * as log from 'log';
import {Queue} from './utils.js';
import {DEV, DATABASE} from '../constants.js';
import {deleteAlbumOrphans} from './albums.js';
import {deleteEpisodeOrphans} from './episodes.js';
import {deleteSongOrphans} from './songs.js';
import {deleteBookmarkOrphans} from './bookmarks.js';

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

// Delete orphans
export const deleteOrphans = async () => {
  await deleteAlbumOrphans();
  await deleteEpisodeOrphans();
  await deleteSongOrphans();
  await deleteBookmarkOrphans();
};

export * from './albums.js';
export * from './artists.js';
export * from './bookmarks.js';
export * from './episodes.js';
export * from './podcasts.js';
export * from './songs.js';
