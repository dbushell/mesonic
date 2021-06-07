// Media
import * as log from 'log';
import * as files from './files.js';
import * as sqlite from '../sqlite/mod.js';
import {MEDIA} from '../constants.js';

// Find existing entry or insert new artist
const findArtist = async (file, artists) => {
  let artist = artists.find(
    (artist) => artist.name === file.name && artist.path === file.path
  );
  if (artist) {
    return artist;
  }
  // Search by `name` only and update `path` (or insert)
  artist = await sqlite.getArtistBy('name', file.name);
  if (artist) {
    if (artist.path !== file.path) {
      await sqlite.updateArtist({...file, id: artist.id});
    }
  } else {
    await sqlite.insertArtist(file);
    artist = await sqlite.getArtistBy('name', file.name);
    log.info(`🎤 ${artist.path}`);
  }
  if (!artist) {
    throw new Error(`Failed to query artist ("${file.name}")`);
  }
  return artist;
};

// Find existing entry or insert new album
const findAlbum = async (file, albums, artist) => {
  let album = albums.find(
    (album) => album.name === file.name && album.path === file.path
  );
  if (album) {
    return album;
  }
  album = await sqlite.getAlbumBy('name', file.name, artist.id);
  if (album) {
    if (album.path !== file.path) {
      await sqlite.updateAlbum({
        ...file,
        artist_id: artist.id,
        id: album.id
      });
    }
  } else {
    await sqlite.insertAlbum({
      ...file,
      artist_id: artist.id
    });
    album = await sqlite.getAlbumBy('name', file.name, artist.id);
    log.info(`💿 ${album.path}`);
  }
  if (!album) {
    throw new Error(
      `Failed to query album ("${file.name}" by "${artist.name}")`
    );
  }
  return album;
};

// Find existing entry or insert new song
const findSong = async (file, songs, artist, album) => {
  let song = songs.find(
    (song) => song.name === file.name && song.path === file.path
  );
  if (song) {
    return song;
  }
  song = await sqlite.getSongBy('name', file.name, artist.id, album.id);
  if (song) {
    if (song.path !== file.path) {
      await sqlite.updateSong({
        ...file,
        artist_id: artist.id,
        album_id: album.id,
        id: song.id
      });
    }
  } else {
    await sqlite.insertSong({
      ...file,
      artist_id: artist.id,
      album_id: album.id
    });
    song = await sqlite.getSongBy('name', file.name, artist.id, album.id);
    log.info(`🎧 ${song.path}`);
  }
  if (!song) {
    throw new Error(
      `Failed to query song ("${file.name}" by "${artist.name}" on "${album.name}")`
    );
  }
  return song;
};

export const syncMedia = async () => {
  const artists = await sqlite.getArtists();
  const artist_files = await files.getMusicFiles(MEDIA);
  log.info(
    `Artists found ${artists.length} (database) ${artist_files.length} (filesystem)`
  );
  for (const artist_file of artist_files) {
    const artist = await findArtist(artist_file, artists);
    const albums = await sqlite.getAlbums({artist_id: artist.id});
    for (const album_file of artist_file.albums) {
      const album = await findAlbum(album_file, albums, artist);
      const songs = await sqlite.getSongs({
        artist_id: artist.id,
        album_id: album.id
      });
      for (const song_file of album_file.songs) {
        const song = await findSong(song_file, songs, artist, album);
        if (!song.size) {
          const meta = await files.getMeta(song.path);
          if (meta.size) {
            await sqlite.updateSongMeta({...song, ...meta});
          } else {
            log.warning(`Failed to sync: ${song.path}`);
            await sqlite.deleteSong(song);
          }
        }
      }
    }
  }

  // Cleanup missing artists
  for (const artist of await sqlite.getArtists()) {
    try {
      const stat = await Deno.lstat(artist.path);
      if (!stat.isDirectory) {
        throw new Error();
      }
    } catch (err) {
      await sqlite.deleteArtist(artist);
    }
  }

  // Delete missing albums
  for (const album of await sqlite.getAlbums()) {
    try {
      const stat = await Deno.lstat(album.path);
      if (!stat.isDirectory) {
        throw new Error();
      }
    } catch (err) {
      await sqlite.deleteAlbum(album);
    }
  }

  // Delete missing songs
  for (const song of await sqlite.getSongs()) {
    try {
      const stat = await Deno.lstat(song.path);
      if (!stat.isFile) {
        throw new Error();
      }
    } catch (err) {
      await sqlite.deleteSong(song);
    }
  }

  // Delete orphaned albums and songs
  await sqlite.deleteOrphans();
};
