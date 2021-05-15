import {writable, derived, get} from 'svelte/store';
import {md5} from './utils.js';

export const serverStore = writable(null);
export const authStore = writable({username: '', password: ''});
export const playbackStore = writable({rate: '1.0'});
export const artistStore = writable(null);
export const albumStore = writable(null);
export const songStore = writable(null);
export const bookmarkInvalidateStore = writable(Date.now());
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
export const fetchProps = async (url, data = {}) => {
  data = await addServerProps({...data});
  // Use `GET` request to avoid CORS issues
  if (/(mesonic\.app|\/localhost|127\.0)/.test(url)) {
    await addServerParams(url, data);
    return {
      method: 'GET'
    };
  }
  // Post JSON to known server
  if (/mesonic/.test(url)) {
    return {
      method: 'POST',
      mode: 'cors',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }
  // Post `x-www-form-urlencoded` to unknown server
  return {
    method: 'POST',
    body: new URLSearchParams(data)
  };
};

export const bookmarkStore = derived(
  [serverStore, bookmarkInvalidateStore],
  async ([$serverStore], set) => {
    if (!($serverStore instanceof URL)) {
      return;
    }
    try {
      const url = new URL('/rest/getBookmarks.view', $serverStore);
      const props = await fetchProps(url);
      const response = await fetch(url, props);
      const json = await response.json();
      const bookmarks = json['subsonic-response']?.bookmarks?.bookmark;
      if (Array.isArray(bookmarks)) {
        bookmarks.forEach((bookmark) => {
          bookmark.progress =
            (100 / bookmark.entry[0].duration) * (bookmark.position / 1000);
        });
        set(bookmarks);
      }
    } catch (err) {
      console.log(err);
      set([]);
    }
  },
  []
);

export const artistListStore = derived(
  [serverStore],
  async ([$serverStore], set) => {
    if (!($serverStore instanceof URL)) {
      return;
    }
    set('loading');
    const url = new URL('/rest/getArtists.view', $serverStore);
    try {
      const props = await fetchProps(url);
      const response = await fetch(url, props);
      const json = await response.json();
      const artists = [];
      const index = json['subsonic-response']?.artists?.index;
      index.forEach((list) => artists.push(...list.artist));
      set(artists);
    } catch (err) {
      console.log(err);
      set('error');
    }
  },
  'loading'
);

export const albumListStore = derived(
  [serverStore, artistStore],
  async ([$serverStore, $artistStore], set) => {
    if (!$artistStore || !($serverStore instanceof URL)) {
      return;
    }
    set('loading');
    try {
      const url = new URL('/rest/getArtist.view', $serverStore);
      const props = await fetchProps(url, {id: $artistStore.id});
      const response = await fetch(url, props);
      const json = await response.json();
      const albums = json['subsonic-response']?.artist?.album;
      set(albums);
    } catch (err) {
      console.log(err);
      set('error');
    }
  },
  'loading'
);

export const songListStore = derived(
  [serverStore, albumStore],
  async ([$serverStore, $albumStore], set) => {
    if (!$albumStore || !($serverStore instanceof URL)) {
      return;
    }
    set('loading');
    try {
      const url = new URL('/rest/getAlbum.view', $serverStore);
      const props = await fetchProps(url, {id: $albumStore.id});
      const response = await fetch(url, props);
      const json = await response.json();
      const songs = json['subsonic-response']?.album?.song;
      set(songs);
    } catch (err) {
      console.log(err);
      set('error');
    }
  },
  'loading'
);

export const nextSongStore = derived(
  [serverStore, songStore],
  async ([$serverStore, $songStore], set) => {
    if (!$songStore || !($serverStore instanceof URL)) {
      return;
    }
    try {
      const url = new URL('/rest/getAlbum.view', $serverStore);
      const props = await fetchProps(url, {id: $songStore.albumId});
      const response = await fetch(url, props);
      const json = await response.json();
      const songs = json['subsonic-response']?.album?.song;
      if (songs.length > 1) {
        for (let i = 0; i < songs.length - 1; i++) {
          if (songs[i].id === $songStore.id) {
            set(songs[i + 1]);
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
