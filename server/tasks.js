// Tasks
import * as log from 'log';
import * as path from 'path';
import * as sqlite from './sqlite/mod.js';
import {syncMedia} from './media/mod.js';
import {syncPodcasts} from './podcasts/mod.js';
import {MEDIA, CONFIG, DATABASE, PODCASTS_SYNC_INTERVAL} from './constants.js';

// Check directories set by environment variables
export const checkEnv = async () => {
  await log.setup({
    handlers: {
      console: new log.handlers.ConsoleHandler('DEBUG', {
        formatter: (record) =>
          `[${record.datetime.toLocaleTimeString('en-GB')}] [${
            record.levelName
          }] ${record.msg}`.replace(/\s\[DEBUG]/, '')
      })
    },
    loggers: {
      default: {
        level: 'DEBUG',
        handlers: ['console']
      }
    }
  });
  try {
    const data_stat = await Deno.lstat(path.resolve(MEDIA));
    if (!data_stat.isDirectory) {
      throw new Error('MESONIC_MEDIA directory does not exist');
    }
    const config_stat = await Deno.lstat(path.resolve(CONFIG));
    if (!config_stat.isDirectory) {
      throw new Error('MESONIC_CONFIG directory does not exist');
    }
  } catch (err) {
    log.critical(err);
    Deno.exit();
  }
};

// Initialise new database with tables
export const createDatabase = async () => {
  const schema = [
    path.join(Deno.cwd(), 'server/sqlite/schema-000.sql'),
    path.join(Deno.cwd(), 'server/sqlite/schema-001.sql')
  ];
  const stat = await Deno.lstat(DATABASE);
  if (!stat.isFile) {
    log.info(`💾 Database setup`);
    await Deno.remove(DATABASE);
    await sqlite.execQuery(`.read ${schema[0]}`);
  }
  let i = await sqlite.runQuery('PRAGMA user_version', {readonly: false});
  i = Number.parseInt(new TextDecoder().decode(i), 10);
  for (++i; i < schema.length; i++) {
    log.info(`💾 Database migration: "${schema[i]}"`);
    await sqlite.execQuery(`.read ${schema[i]}`);
  }
};

let isMediaSync = false;
let isPodcastSync = false;
let podcastSync;

export const syncData = async () => {
  log.info(`⏳ Media sync started`);
  if (isMediaSync) {
    log.warning('Media sync already in progress');
  } else {
    isMediaSync = true;
    await syncMedia();
    isMediaSync = false;
  }
  log.info('⌛ Media sync done');
  if (podcastSync) {
    return;
  }
  podcastSync = () => {
    if (isPodcastSync) {
      log.warning('Podcast sync already in progress');
    }
    isPodcastSync = true;
    log.info('⌛ Podcast sync started');
    syncPodcasts()
      .then(() => {
        log.info('⌛ Podcast sync done');
      })
      .catch((err) => log.error(err))
      .finally(() => {
        isPodcastSync = false;
        setTimeout(podcastSync, PODCASTS_SYNC_INTERVAL);
      });
  };
  podcastSync();
};

// Remove old media from database
export const tidyDatabase = async () => {
  log.info(`🧹 Tidying database`);
  await sqlite.deleteOrphans();
};
