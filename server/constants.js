// Constants
import * as path from 'path';

// Version string
export const VER = '0.19.5';

// Development mode
export const DEV = Number(Deno.env.get('MESONIC_DEV')) === 1;

// Directory path to sync audio (read-only)
export const MEDIA = path.resolve(Deno.env.get('MESONIC_MEDIA'));
export const PODCASTS = path.resolve(Deno.env.get('MESONIC_PODCASTS'));

// Remove episodes older than 90 days (ms)
export const PODCASTS_MAX_AGE = 1000 * 60 * 60 * 24 * 90;

// Update podcast images after one week (ms)
export const PODCASTS_IMAGE_AGE = 1000 * 60 * 60 * 24 * 7;

// Trigger podcast sync every hour (ms)
export const PODCASTS_SYNC_INTERVAL = 1000 * 60 * 60;

// Directory path to store database and other config
export const CONFIG = path.resolve(Deno.env.get('MESONIC_CONFIG'));

// SQLite database file path
export const DATABASE = path.join(CONFIG, 'mesonic.db');

// File extensions to consider as audio when syncing media
export const EXTENSIONS = ['mp3', 'm4b'];

// HTTP headers for CORS API response
export const HEADERS = {
  'access-control-allow-headers':
    'accept, accept-encoding, content-type, content-length, range',
  'access-control-allow-methods': 'POST, GET, HEAD, OPTIONS',
  'access-control-allow-origin': '*',
  'content-type': 'application/json'
};
