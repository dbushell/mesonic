// Tasks
import * as log from 'log';
import * as path from 'path';
import * as sync from './sync.js';
import * as sqlite from './sqlite.js';
import {MEDIA, CONFIG, SCHEMA, DATABASE} from './constants.js';

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
  try {
    const stat = await Deno.lstat(DATABASE);
    if (!stat.isFile) {
      await Deno.remove(DATABASE);
      throw new Error();
    }
  } catch (err) {
    log.info(`💾 Creating database`);
    await sqlite.execQuery(`.read ${SCHEMA}`);
  }
};

// Sync media directory to database
let isSync = false;
export const syncMedia = async () => {
  log.info(`⏳ Sync started`);
  if (isSync) {
    log.warn('Sync already in progress');
  } else {
    isSync = true;
    await sync.syncData();
    isSync = false;
  }
  log.info('⌛ Sync done');
};

// Remove old media from database
export const tidyDatabase = async () => {
  log.info(`🧹 Tidying database`);
  await sqlite.deleteOrphans();
};
