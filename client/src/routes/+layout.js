import cookie from 'cookie';
import {browser, building} from '$app/environment';
import {
  fetchBookmarks,
  playbackStore,
  proxyStore,
  serverStore
} from '../stores.js';
import {loadIndexedDB} from '../offline.js';

export const load = async (loadProps) => {
  const {fetch, data: session} = loadProps;
  let server;
  if (browser) {
    server = globalThis.localStorage.getItem('server');
  }
  if (building) {
    server = new URL('/demo/', process.env.MESONIC_HOST);
  }
  if (server) {
    // Use server from browser storage
    serverStore.set(new URL(server));
  } else {
    proxyStore.set(null);
    // Use internal proxy for SSR
    if (!browser && session.proxy) {
      proxyStore.set(new URL(session.proxy));
    }
    // Use default or cookie defined server
    serverStore.set(new URL(session.server));
  }

  // Ensure all demo endpoints are prerendered
  if (building) {
    await fetch('/demo/createBookmark.view');
    await fetch('/demo/deleteBookmark.view');
    await fetch('/demo/getAlbum.view');
    await fetch('/demo/getArtist.view');
    await fetch('/demo/getArtists.view');
    await fetch('/demo/getBookmarks.view');
    await fetch('/demo/getPodcasts.view');
    await fetch('/demo/getScanStatus.view');
    await fetch('/demo/ping.view');
    await fetch('/demo/startScan.view');
  } else {
    await fetchBookmarks({fetch});
  }

  if (!browser) {
    return {};
  }

  serverStore.subscribe((state) => {
    if (state instanceof URL) {
      // Save to browser storage
      globalThis.localStorage.setItem('server', state);
      // Save to cookie for new session server renders
      document.cookie = cookie.serialize('server', state, {
        path: '/',
        sameSite: true,
        maxAge: 60 * 60 * 24 * 30
      });
    }
  });

  // Restore options from browser storage
  try {
    let playback = globalThis.localStorage.getItem('playback');
    playback = JSON.parse(playback);
    if ('rate' in playback) {
      playbackStore.set(playback);
    }
  } catch (err) {}

  // Save options to browser storage
  playbackStore.subscribe((playback) => {
    globalThis.localStorage.setItem('playback', JSON.stringify(playback));
  });

  loadIndexedDB();

  return {};
};
