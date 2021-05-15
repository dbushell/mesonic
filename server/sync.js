// Sync
import * as log from 'log';
import * as files from './files.js';
import * as sqlite from './sqlite.js';
import {MEDIA} from './constants.js';

export const syncData = async () => {
  const getArtist = async (file, artists) => {
    // Return matching artist by `name` and `path`
    let artist = artists.find(
      (artist) => artist.name === file.name && artist.path === file.path
    );
    if (artist) {
      return artist;
    }
    // Search by `name` only and update `path` (or insert)
    artist = await sqlite.getArtistByKeyValue('name', file.name);
    if (artist) {
      if (artist.path !== file.path) {
        await sqlite.updateArtist({...file, id: artist.id});
      }
    } else {
      await sqlite.insertArtist(file);
      artist = await sqlite.getArtistByKeyValue('name', file.name);
      log.info(`🎤 ${artist.path}`);
    }
    if (!artist) {
      throw new Error(`Failed to query artist ("${file.name}")`);
    }
    return artist;
  };

  const getAlbum = async (file, albums, artist) => {
    // Return matching album by `name` and `path`
    let album = albums.find(
      (album) => album.name === file.name && album.path === file.path
    );
    if (album) {
      return album;
    }
    album = await sqlite.getAlbumByKeyValue('name', file.name, artist.id);
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
      album = await sqlite.getAlbumByKeyValue('name', file.name, artist.id);
      log.info(`💿 ${album.path}`);
    }
    if (!album) {
      throw new Error(
        `Failed to query album ("${file.name}" by "${artist.name}")`
      );
    }
    return album;
  };

  const getSong = async (file, songs, artist, album) => {
    // Return matching song by `name` and `path`
    let song = songs.find(
      (song) => song.name === file.name && song.path === file.path
    );
    if (song) {
      return song;
    }
    song = await sqlite.getSongByKeyValue(
      'name',
      file.name,
      artist.id,
      album.id
    );
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
      song = await sqlite.getSongByKeyValue(
        'name',
        file.name,
        artist.id,
        album.id
      );
      log.info(`🎧 ${song.path}`);
    }
    if (!song) {
      throw new Error(
        `Failed to query song ("${file.name}" by "${artist.name}" on "${album.name}")`
      );
    }
    return song;
  };

  // Get all artists in database
  const artists = await sqlite.getArtists();
  const artist_files = await files.getMusicFiles(MEDIA);
  log.info(
    `Artists found ${artists.length} (database) ${artist_files.length} (filesystem)`
  );
  for (const artist_file of artist_files) {
    const artist = await getArtist(artist_file, artists);
    const albums = await sqlite.getAlbums(artist.id);
    for (const album_file of artist_file.albums) {
      const album = await getAlbum(album_file, albums, artist);
      const songs = await sqlite.getSongs(artist.id, album.id);
      for (const song_file of album_file.songs) {
        const song = await getSong(song_file, songs, artist, album);
        if (!song.size) {
          const meta = await files.getMeta(song.path);
          if (meta.size) {
            await sqlite.updateSongMeta({...song, ...meta});
          } else {
            log.warning(`Failed to sync: ${song.path}`);
            await sqlite.deleteSong(song.id);
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
      log.warning(`Removing artist: ${artist.path}`);
      await sqlite.deleteArtist(artist.id);
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
      log.warning(`Removing album: ${album.path}`);
      await sqlite.deleteAlbum(album.id);
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
      log.warning(`Removing song: ${song.path}`);
      await sqlite.deleteSong(song.id);
    }
  }

  // Delete orphaned albums and songs
  await sqlite.deleteOrphans();
};
