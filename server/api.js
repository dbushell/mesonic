// API
import * as path from 'path';
import * as hash from 'hash';
import * as tasks from './tasks.js';
import * as sqlite from './sqlite/mod.js';
import {createPodcast} from './podcasts/mod.js';

// Sort alphabetical with "Track 10" after " Track 1"
const naturalCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base'
});
const naturalSort = (item, key = 'name') =>
  item.sort((a, b) => naturalCollator.compare(a[key], b[key]));

// Return image URL for podcast
const coverArt = ({url}) => {
  const src = hash.createHash('sha256').update(url).toString();
  return `/data/podcasts/${src}.webp`;
};

// Convert `song` database entry to API data
export const songData = (song, artist, album, include_path = false) => {
  const value = {
    isDir: false,
    isVideo: false,
    id: `song-${song.id}`,
    name: song.name,
    title: song.name,
    artistId: `artist-${artist.id}`,
    artist: artist.name,
    albumId: `album-${album.id}`,
    album: album.name,
    parent: `album-${album.id}`,
    created: new Date(song.created_at || Date.now()).toISOString(),
    modified: new Date(song.modified_at || Date.now()).toISOString(),
    duration: Math.round((song.duration ?? 0) / 1000),
    bitrate: Math.round((song.bitrate ?? 0) / 1000),
    size: song.size,
    type: 'song'
  };
  if (song.path) {
    const parse_path = path.parse(song.path);
    value.suffix = parse_path.ext.substring(1);
    if (include_path) {
      value.path = parse_path;
    }
  }
  switch (value.suffix) {
    case 'm4b':
      value.contentType = 'audio/m4b';
      break;
    default:
      value.contentType = 'audio/mpeg';
  }
  return value;
};

// Convert `album` database entry to API data
export const albumData = (album, artist, songs = false) => {
  const value = {
    isDir: true,
    id: `album-${album.id}`,
    name: album.name,
    title: album.name,
    artistId: `artist-${artist.id}`,
    artist: artist.name,
    parent: `artist-${artist.id}`,
    created: new Date(album.created_at).toISOString(),
    songCount: album.song_count,
    duration: Math.round(album.duration / 1000)
  };
  if (Array.isArray(songs)) {
    value.song = songs.map((song) => songData(song, artist, album));
  }
  return value;
};

// Convert `artist` database entry to API data
export const artistData = (artist, albums = false) => {
  const value = {
    id: `artist-${artist.id}`,
    name: artist.name,
    title: artist.name,
    albumCount: artist.album_count
  };
  if (Array.isArray(albums)) {
    value.album = albums.map((album) => albumData(album, artist));
  }
  return value;
};

// Convert `podcast` database entry to API data
export const podcastData = (podcast) => {
  return {
    id: `podcast-${podcast.id}`,
    url: podcast.url,
    name: podcast.name,
    title: podcast.name,
    episodeCount: podcast.episode_count,
    modified: new Date(podcast.modified_at || Date.now()).toISOString(),
    coverArt: coverArt(podcast)
  };
};

// Convert `episode` database entry to API data
export const episodeData = (episode, podcast) => {
  const data = songData(episode, podcast, podcast);
  data.id = data.id.replace('song', 'episode');
  data.stream = episode.url;
  data.artist = 'Podcasts';
  data.artistId = 'podcasts';
  data.albumId = `podcast-${String(podcast.id).replace(/[^\d]/g, '')}`;
  data.parent = data.albumId;
  data.type = 'episode';
  data.coverArt = coverArt(podcast);
  return data;
};

let isScan = false;
export const startScan = async () => {
  const count = await sqlite.countSongs();
  isScan = true;
  tasks.syncData().then(() => (isScan = false));
  return {scanStatus: {count, scanning: isScan}};
};

export const getScanStatus = async () => {
  const count = await sqlite.countSongs();
  return {scanStatus: {count, scanning: isScan}};
};

export const getPodcasts = async (id = 0) => {
  id = String(id).replace(/[^\d]/g, '');
  id = isNaN(id) ? 0 : Number.parseInt(id, 10);
  const podcasts = await sqlite.getPodcasts(id ? {key: 'id', value: id} : {});
  const channel = podcasts.map(podcastData);
  if (id) {
    await Promise.all(
      channel.map(async (podcast) => {
        podcast.episode = await sqlite.getEpisodes({podcast_id: id});
        podcast.episode = podcast.episode.map((episode) =>
          episodeData(episode, podcast)
        );
      })
    );
  }
  return {podcasts: {channel}};
};

export const createPodcastChannel = async (url = '') => {
  await createPodcast(url);
};

export const deletePodcastChannel = async (id = 0) => {
  id = String(id).replace(/[^\d]/g, '');
  id = isNaN(id) ? 0 : Number.parseInt(id, 10);
  if (id) {
    await sqlite.deletePodcast({id});
    await sqlite.deleteEpisodeOrphans();
  }
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

export const getArtist = async (id) => {
  id = Number.parseInt(String(id).replace(/[^\d]/g, ''), 10);
  const artist = await sqlite.getArtistBy('id', id);
  const albums = await sqlite.getAlbums({artist_id: artist.id});
  naturalSort(albums);
  return {
    artist: artistData(artist, albums)
  };
};

export const getAlbum = async (id) => {
  id = Number.parseInt(String(id).replace(/[^\d]/g, ''), 10);
  const album = await sqlite.getAlbumBy('id', id);
  const artist = await sqlite.getArtistBy('id', album.artist_id);
  const songs = await sqlite.getSongs({
    artist_id: artist.id,
    album_id: album.id
  });
  naturalSort(songs);
  return {
    album: albumData(album, artist, songs)
  };
};

export const getSong = async (id, include_path = false) => {
  id = Number.parseInt(String(id).replace(/[^\d]/g, ''), 10);
  const song = await sqlite.getSongBy('id', id);
  const artist = await sqlite.getArtistBy('id', song.artist_id);
  const album = await sqlite.getAlbumBy('id', song.album_id);
  return {
    song: songData(song, artist, album, include_path)
  };
};

export const getEpisode = async (id) => {
  id = Number.parseInt(String(id).replace(/[^\d]/g, ''), 10);
  const episode = await sqlite.getEpisodeBy('id', id);
  const podcast = await sqlite.getPodcastBy('id', episode.podcast_id);
  return {
    episode: episodeData(episode, podcast)
  };
};

export const getBookmarks = async () => {
  const list = [];
  const bookmarks = await sqlite.getBookmarks();
  await Promise.all(
    bookmarks.map(async (bookmark, i) => {
      try {
        let entry;
        if (bookmark.type === 'episode') {
          entry = (await getEpisode(bookmark.entity_id)).episode;
        } else {
          entry = (await getSong(bookmark.entity_id)).song;
        }
        const value = {
          username: 'admin',
          comment: bookmark.comment,
          position: bookmark.position,
          created: new Date(bookmark.created_at).toISOString(),
          changed: new Date(bookmark.modified_at).toISOString(),
          entry: [entry]
        };
        list.splice(i, 0, value);
      } catch (err) {
        deleteBookmark(bookmark.entity_id, bookmark.type);
      }
    })
  );
  return {bookmarks: {bookmark: list}};
};

export const createBookmark = async (type_id, position, comment) => {
  let [, type, id] = String(type_id).match(/(?:([^\d]+?)-)?(\d+)/);
  id = Number.parseInt(id, 10);
  position = Number.parseInt(position, 10) || 0;
  comment = String(comment);
  type = type || 'song';
  await sqlite.deleteBookmark(id, type);
  await sqlite.insertBookmark({entity_id: id, type, position, comment});
};

export const deleteBookmark = async (type_id) => {
  let [, type, id] = String(type_id).match(/(?:([^\d]+?)-)?(\d+)/);
  id = Number.parseInt(id, 10);
  type = type || 'song';
  await sqlite.deleteBookmark(id, type);
};

export const getIndexes = async () => {
  const {
    artists: {index}
  } = await getArtists();
  return {
    indexes: {
      lastModified: 0,
      ignoredArticles: '',
      index
    }
  };
};

export const getMusicDirectory = async (dir_id) => {
  const [, type, id] = String(dir_id).match(/^(\w+)-(\d+)$/);
  if (type === 'artist') {
    const {artist} = await getArtist(id);
    return {
      directory: {
        id: dir_id,
        name: artist.name,
        child: artist.album
      }
    };
  }
  if (type === 'album') {
    const {album} = await getAlbum(id);
    return {
      directory: {
        id: dir_id,
        name: album.name,
        parent: album.artistId,
        child: album.song
      }
    };
  }
  throw new Error();
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

export const getMusicFolders = async () => ({musicFolders: {musicFolder: []}});

export const getGenres = async () => ({genres: {genres: []}});

export const getPlaylists = async () => ({playlists: {playlist: []}});

export const getArtistInfo = async () => ({artistInfo: {biography: ''}});

export const getArtistInfo2 = async () => ({artistInfo2: {biography: ''}});

export const getAlbumList = async () => ({albumList: {album: []}});

export const getAlbumList2 = async () => ({albumList2: {album: []}});
