// Constants
import * as path from 'path';

// Development mode
export const DEV = Number(Deno.env.get('MESONIC_DEV')) === 1;

// Directory path to sync audio (read-only)
export const MEDIA = path.resolve(Deno.env.get('MESONIC_MEDIA'));

// Directory path to store database and other config
export const CONFIG = path.resolve(Deno.env.get('MESONIC_CONFIG'));

// SQLite database schema file path
export const SCHEMA = path.join(Deno.cwd(), 'server/schema.sql');

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
