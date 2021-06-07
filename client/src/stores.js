import {writable, derived, get} from 'svelte/store';
import {md5} from './utils.js';

export const proxyStore = writable();
export const serverStore = writable();
export const authStore = writable({username: '', password: ''});
export const playbackStore = writable({rate: '1.0'});
export const podcastStore = writable();
export const artistStore = writable();
export const albumStore = writable();
export const songStore = writable();
export const bookmarkStore = writable([]);
export const scanStore = writable({count: 0, scanning: false});

// Append default request data and hashed auth credentials
const addServerProps = async (data = {}) => {
  data = {
    ...data,
    f: 'json',
    v: '1.16.0',
    c: 'mesonic'
  };
  const $authStore = get(authStore);
  if ($authStore.username) {
    data.u = $authStore.username;
  }
  if ($authStore.password) {
    data.s = await md5(
      window.crypto.getRandomValues(new Uint32Array(10)).toString()
    );
    data.t = await md5($authStore.password + data.s);
  }
  return data;
};

// Append default request data to URL query string
export const addServerParams = async (url, data = {}) => {
  data = {...data, ...(await addServerProps())};
  for (const [key, value] of Object.entries(data)) {
    url.searchParams.set(key, value);
  }
  return url;
};

// Return appropriate `fetch()` props with default data
export const fetchProps = async (url, data = {}, server = null) => {
  if (!(url instanceof URL)) {
    if (!server) {
      server = get(proxyStore);
      if (!server) {
        server = get(serverStore);
      }
    }
    if (/^\/rest\//.test(url) && /^\/demo\//.test(server.pathname)) {
      url = url.replace(/^\/rest\//, '/demo/');
    }
    url = new URL(url, server);
  }
  data = await addServerProps({...data});
  // Use `GET` request to avoid CORS issues
  if (/(mesonic\.app|\/demo\/)/.test(url)) {
    await addServerParams(url, data);
    return [
      url,
      {
        method: 'GET'
      }
    ];
  }
  // Post JSON to known server
  if (/(mesonic|localhost)/.test(url)) {
    return [
      url,
      {
        method: 'POST',
        mode: 'cors',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    ];
  }
  // Post `x-www-form-urlencoded` to unknown server
  return [
    url,
    {
      method: 'POST',
      body: new URLSearchParams(data)
    }
  ];
};

// Ping the new server before updating the store
export const updateServer = async (server) => {
  try {
    const [url, props] = await fetchProps('/rest/ping.view', server);
    const response = await fetch(url, props);
    const json = await response.json();
    if (json['subsonic-response'].status === 'ok') {
      songStore.set(null);
      serverStore.set(new URL(server));
      return true;
    }
  } catch (err) {
    console.log(err);
    return false;
  }
};

export const fetchPodcasts = async ({fetch} = {}) => {
  try {
    const [url, props] = await fetchProps('/rest/getPodcasts.view');
    const response = await (fetch
      ? fetch(url.pathname)
      : globalThis.fetch(url, props));
    const json = await response.json();
    const podcasts = json['subsonic-response']?.podcasts;
    return podcasts.channel;
  } catch (err) {
    console.log(err);
    return [];
  }
};

export const fetchEpisodes = async ({fetch, id}) => {
  try {
    const [url, props] = await fetchProps('/rest/getPodcasts.view', {
      id,
      includeEpisodes: true
    });
    const response = await (fetch
      ? fetch(url.pathname)
      : globalThis.fetch(url, props));
    const json = await response.json();
    const podcast = json['subsonic-response']?.podcasts?.channel[0];
    podcastStore.set(podcast);
    return podcast.episode;
  } catch (err) {
    console.log(err);
    return [];
  }
};

export const fetchArtists = async ({fetch} = {}) => {
  let artists = [];
  try {
    const [url, props] = await fetchProps('/rest/getArtists.view');
    const response = await (fetch
      ? fetch(url.pathname)
      : globalThis.fetch(url, props));
    const json = await response.json();
    const index = json['subsonic-response']?.artists?.index;
    index.forEach((list) => artists.push(...list.artist));
  } catch (err) {
    console.log(err);
    artists = [];
  }
  return artists;
};

export const fetchAlbums = async ({fetch, id}) => {
  try {
    const [url, props] = await fetchProps('/rest/getArtist.view', {id});
    const response = await (fetch
      ? fetch(url.pathname)
      : globalThis.fetch(url, props));
    const json = await response.json();
    const artist = json['subsonic-response']?.artist;
    artistStore.set(artist);
    return artist.album;
  } catch (err) {
    console.log(err);
    return [];
  }
};

export const fetchSongs = async ({fetch, id}) => {
  try {
    const [url, props] = await fetchProps('/rest/getAlbum.view', {id});
    const response = await (fetch
      ? fetch(url.pathname)
      : globalThis.fetch(url, props));
    const json = await response.json();
    const album = json['subsonic-response']?.album;
    albumStore.set(album);
    return album.song;
  } catch (err) {
    console.log(err);
    return [];
  }
};

export const fetchBookmarks = async ({fetch} = {}) => {
  try {
    const [url, props] = await fetchProps('/rest/getBookmarks.view');
    const response = await (fetch
      ? fetch(url.pathname)
      : globalThis.fetch(url, props));
    const json = await response.json();
    const items = json['subsonic-response']?.bookmarks?.bookmark;
    if (Array.isArray(items)) {
      items.forEach((bookmark) => {
        bookmark.progress =
          (100 / bookmark.entry[0].duration) * (bookmark.position / 1000);
      });
      bookmarkStore.set([...items]);
    }
  } catch (err) {
    console.log(err);
    bookmarkStore.set([]);
  }
  return get(bookmarkStore);
};

// Create a song bookmark and refresh the bookmark store
export const createBookmark = async ({id, position}) => {
  try {
    const [url, props] = await fetchProps('/rest/createBookmark.view', {
      id,
      position,
      comment: navigator.userAgent
    });
    const response = await fetch(url, props);
    const json = await response.json();
    const {status, error} = json['subsonic-response'];
    if (status !== 'ok') {
      throw new Error(error?.message);
    }
    fetchBookmarks();
  } catch (err) {
    console.log(err);
  }
};

// Delete a song bookmark and refresh the bookmark store
export const deleteBookmark = async ({id}) => {
  try {
    const [url, props] = await fetchProps('/rest/deleteBookmark.view', {id});
    const response = await fetch(url, props);
    const json = await response.json();
    const {status, error} = json['subsonic-response'];
    if (status !== 'ok') {
      throw new Error(error?.message);
    }
    fetchBookmarks();
  } catch (err) {
    console.log(err);
  }
};

// Add new podcast
export const createPodcast = async (data) => {
  try {
    const [url, props] = await fetchProps('/rest/createPodcastChannel.view', {
      url: data.url
    });
    const response = await fetch(url, props);
    const json = await response.json();
    const {status, error} = json['subsonic-response'];
    if (status !== 'ok') {
      throw new Error(error?.message);
    }
    return true;
  } catch (err) {
    console.log(err);
  }
};

// Remove existing podcast
export const deletePodcast = async ({id}) => {
  try {
    const [url, props] = await fetchProps('/rest/deletePodcastChannel.view', {
      id
    });
    const response = await fetch(url, props);
    const json = await response.json();
    const {status, error} = json['subsonic-response'];
    if (status !== 'ok') {
      throw new Error(error?.message);
    }
  } catch (err) {
    console.log(err);
  }
};

// Start a new media scan or return the current status
export const getScanStatus = async (isStart = true) => {
  const $scanStore = get(scanStore);
  if (isStart && $scanStore.scanning) {
    return;
  }
  try {
    scanStore.set({...$scanStore, scanning: true});
    const [url, props] = await fetchProps(
      `/rest/${isStart ? 'startScan' : 'getScanStatus'}.view`
    );
    const response = await fetch(url, props);
    const json = await response.json();
    const {status, scanStatus, error} = json['subsonic-response'];
    if (status !== 'ok') {
      throw new Error(error?.message);
    }
    scanStore.set({...scanStatus});
    if (scanStatus.scanning === true) {
      setTimeout(() => getScanStatus(false), 1000);
    }
  } catch (err) {
    console.log(err);
    scanStore.set({...$scanStore, scanning: false});
  }
};

export const nextSongStore = derived(
  [serverStore, songStore],
  async ([$serverStore, $songStore], set) => {
    if (!$songStore || !($serverStore instanceof URL)) {
      return;
    }
    if (['episode'].includes($songStore.type)) {
      set(null);
      return;
    }
    try {
      const [url, props] = await fetchProps('/rest/getAlbum.view', {
        id: $songStore.albumId
      });
      const response = await fetch(url, props);
      const json = await response.json();
      const songs = json['subsonic-response']?.album?.song;
      if (songs.length > 1) {
        for (let i = 0; i < songs.length - 1; i++) {
          if (songs[i].id === $songStore.id) {
            const newSong = songs[i + 1];
            set(newSong);
            return;
          }
        }
      }
    } catch (err) {
      console.log(err);
    }
    set(null);
  },
  null
);
