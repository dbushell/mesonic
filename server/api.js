// Data
import * as log from 'log';
import * as path from 'path';
import * as tasks from './tasks.js';
import * as sqlite from './sqlite.js';
import {naturalSort} from './utils.js';

export const songData = (song, artist, album, include_path = false) => {
  const parse_path = path.parse(song.path);
  const value = {
    isDir: false,
    isVideo: false,
    id: song.id,
    name: song.name,
    title: song.name,
    artistId: artist.id,
    artist: artist.name,
    albumId: album.id,
    album: album.name,
    parent: album.id,
    created: new Date(song.created_at).toISOString(),
    duration: Math.round(song.duration / 1000),
    bitrate: Math.round(song.bitrate / 1000),
    size: song.size,
    suffix: parse_path.ext.substring(1)
  };
  switch (value.suffix) {
    case 'm4b':
      value.contentType = 'audio/m4b';
      break;
    default:
      value.contentType = 'audio/mpeg';
  }
  if (include_path) {
    value.path = parse_path;
  }
  return value;
};

export const albumData = (album, artist, songs = false) => {
  const value = {
    isDir: true,
    id: album.id,
    name: album.name,
    title: album.name,
    artistId: artist.id,
    artist: artist.name,
    parent: artist.id,
    created: new Date(album.created_at).toISOString(),
    songCount: album.song_count,
    duration: Math.round(album.duration / 1000)
  };
  if (Array.isArray(songs)) {
    value.song = songs.map((song) => songData(song, artist, album));
  }
  return value;
};

export const artistData = (artist, albums = false) => {
  const value = {
    id: artist.id,
    name: artist.name,
    title: artist.name,
    albumCount: artist.album_count
  };
  if (Array.isArray(albums)) {
    value.album = albums.map((album) => albumData(album, artist));
  }
  return value;
};

let isScan = false;
export const startScan = async () => {
  const count = await sqlite.countSongs();
  isScan = true;
  tasks.syncMedia().then(() => (isScan = false));
  return {scanStatus: {count, scanning: isScan}};
};

export const getScanStatus = async () => {
  const count = await sqlite.countSongs();
  return {scanStatus: {count, scanning: isScan}};
};

export const getArtists = async () => {
  const index = {};
  const artists = await sqlite.getArtists();
  artists.forEach((artist) => {
    const key = artist.name.substr(0, 1).toUpperCase();
    const value = artistData(artist);
    if (Object.keys(index).includes(key)) {
      index[key].artist.push(value);
    } else {
      index[key] = {
        name: key,
        artist: [value]
      };
    }
  });
  return {
    artists: {
      ignoredArticles: '',
      index: Object.values(index)
    }
  };
};

export const getArtist = async (artist_id) => {
  artist_id = Number.parseInt(artist_id, 10);
  const artist = await sqlite.getArtistByKeyValue('id', artist_id);
  const albums = await sqlite.getAlbums(artist.id);
  naturalSort(albums);
  return {
    artist: artistData(artist, albums)
  };
};

export const getAlbum = async (album_id) => {
  album_id = Number.parseInt(album_id, 10);
  const album = await sqlite.getAlbumByKeyValue('id', album_id);
  const artist = await sqlite.getArtistByKeyValue('id', album.artist_id);
  const songs = await sqlite.getSongs(artist.id, album.id);
  naturalSort(songs);
  return {
    album: albumData(album, artist, songs)
  };
};

export const getSong = async (song_id, include_path = false) => {
  song_id = Number.parseInt(song_id, 10);
  const song = await sqlite.getSongByKeyValue('id', song_id);
  const artist = await sqlite.getArtistByKeyValue('id', song.artist_id);
  const album = await sqlite.getAlbumByKeyValue('id', song.album_id);
  return {
    song: songData(song, artist, album, include_path)
  };
};

export const getBookmarks = async () => {
  const list = [];
  const bookmarks = await sqlite.getBookmarks();
  await Promise.all(
    bookmarks.map(async (bookmark, i) => {
      try {
        const {song} = await getSong(bookmark.song_id);
        const value = {
          username: 'admin',
          comment: bookmark.comment,
          position: bookmark.position,
          created: new Date(bookmark.created_at).toISOString(),
          changed: new Date(bookmark.modified_at).toISOString(),
          entry: [song]
        };
        list.splice(i, 0, value);
      } catch (err) {
        log.error(err);
        return;
      }
    })
  );
  return {bookmarks: {bookmark: list}};
};

export const createBookmark = async (song_id, position, comment) => {
  song_id = Number.parseInt(song_id, 10);
  position = Number.parseInt(position, 10) || 0;
  comment = String(comment);
  await sqlite.deleteBookmark(song_id, true);
  await sqlite.insertBookmark({song_id, position, comment});
};

export const deleteBookmark = async (song_id) => {
  song_id = Number.parseInt(song_id, 10);
  await sqlite.deleteBookmark(song_id, true);
};

export const getUser = async () => {
  return {
    user: {
      username: 'admin',
      adminRole: false,
      downloadRole: false,
      scrobblingEnabled: false,
      settingsRole: false,
      uploadRole: false,
      playlistRole: false,
      coverArtRole: false,
      commentRole: false,
      podcastRole: false,
      streamRole: false,
      jukeboxRole: false,
      shareRole: false,
      videoConversionRole: false,
      folder: [1]
    }
  };
};

export const getIndexes = async () => ({
  indexes: {lastModified: 0, ignoredArticles: '', index: []}
});

export const getMusicFolders = async () => ({musicFolders: {musicFolder: []}});

export const getMusicDirectory = async () => ({directory: {child: []}});

export const getGenres = async () => ({genres: {genres: []}});

export const getPlaylists = async () => ({playlists: {playlists: []}});

export const getPodcasts = async () => ({podcasts: {podcasts: []}});

export const getArtistInfo = async () => ({artistInfo: {biography: ''}});

export const getArtistInfo2 = async () => ({artistInfo2: {biography: ''}});

export const getAlbumList = async () => ({albumList: {album: []}});

export const getAlbumList2 = async () => ({albumList2: {album: []}});
