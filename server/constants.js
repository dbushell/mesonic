// Constants
import * as path from 'path';

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
