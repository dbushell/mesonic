// Files
import * as log from 'log';
import * as path from 'path';
import {EXTENSIONS} from '../constants.js';

// Directory names must begin with `[A-Za-z0-9_]` character class
const r_dir = /^\w/;

// File names must end with extension and not begin "." or "_"
const r_file = new RegExp(`^(?!\\.|_).*\\.(${EXTENSIONS.join('|')})$`);

// Return list of matching directories in path
export const getDirectories = async (root_path) => {
  const paths = [];
  for await (const entry of Deno.readDir(root_path)) {
    if (entry.isDirectory && r_dir.test(entry.name)) {
      paths.push(path.join(root_path, entry.name));
    }
  }
  return paths;
};

// Return list of matching files in path
export const getFiles = async (root_path) => {
  const paths = [];
  for await (const entry of Deno.readDir(root_path)) {
    if (entry.isFile && r_file.test(entry.name)) {
      paths.push(path.join(root_path, entry.name));
    }
  }
  return paths;
};

// Return nested array of artists, albums, and songs
export const getMusicFiles = async (root_path) => {
  let data = await getDirectories(root_path);

  const mapSongs = async (song_path) => ({
    path: song_path,
    name: path.parse(song_path).name
  });

  const mapAlbums = async (album_path) => ({
    path: album_path,
    name: path.basename(album_path),
    songs: await Promise.all((await getFiles(album_path)).map(mapSongs))
  });

  const mapArtists = async (artist_path) => ({
    path: artist_path,
    name: path.basename(artist_path),
    albums: await Promise.all(
      (await getDirectories(artist_path)).map(mapAlbums)
    )
  });

  data = await Promise.all(data.map(mapArtists));

  return data;
};

// Run FFMPEG to fetch file metadata
export const getMeta = async (file_path) => {
  try {
    const stat = await Deno.lstat(file_path);
    if (!stat.isFile) {
      throw new Error('File not found');
    }
    const process = Deno.run({
      cmd: [
        'ffprobe',
        '-v',
        'fatal',
        '-show_streams',
        '-select_streams',
        'a:0',
        '-print_format',
        'json',
        file_path
      ],
      stdout: 'piped'
    });
    const [status, stdout] = await Promise.all([
      process.status(),
      process.output()
    ]);
    process.close();
    if (!status.success) {
      throw new Error('Failed to probe file');
    }
    const json = JSON.parse(new TextDecoder().decode(stdout));
    return {
      duration: Math.round(Number.parseFloat(json.streams[0].duration) * 1000),
      bitrate: Number.parseInt(json.streams[0].bit_rate, 10),
      codec: String(json.streams[0].codec_name),
      size: stat.size
    };
  } catch (err) {
    log.error(`ffprobe failed: ${file_path}`);
    log.error(err);
    return {};
  }
};
