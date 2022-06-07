<script context="module">
  import cookie from 'cookie';
  import {browser, prerendering} from '$app/env';
  import {
    fetchBookmarks,
    playbackStore,
    proxyStore,
    serverStore
  } from '../stores.js';
  import {loadIndexedDB} from '../offline.js';

  export const load = async (loadProps) => {
    const {fetch} = loadProps;
    let server;
    if (browser) {
      server = globalThis.localStorage.getItem('server');
    }
    if (prerendering) {
      server = new URL('/demo/', process.env.MESONIC_HOST);
    }
    if (server) {
      // Use server from browser storage
      serverStore.set(new URL(server));
    } else {
      const {session} = loadProps;
      proxyStore.set(null);
      // Use internal proxy for SSR
      if (!browser && session.proxy) {
        proxyStore.set(new URL(session.proxy));
      }
      // Use default or cookie defined server
      serverStore.set(new URL(session.server));
      console.log(session);
    }

    // Ensure all demo endpoints are prerendered
    if (prerendering) {
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
</script>

<script>
  import {page} from '$app/stores';
  import Header from '../components/header.svelte';
  import Footer from '../components/footer.svelte';
  import Player from '../components/player.svelte';
  import Browse from '../components/browse.svelte';
  import {songStore} from '../stores.js';

  const heading = `meSonic`;
  let title;
  $: {
    title = heading;
    if ($songStore) {
      const songName = $songStore.name;
      const albumName = $songStore.album;
      title = `${heading} – ${albumName}`;
      if (songName !== albumName) {
        title = `${title} – ${songName}`;
      }
    }
  }

  let isBrowse;
  let isBookmarks;
  let isPodcasts;
  let isSettings;

  $: {
    isBookmarks = /^\/bookmarks/.test($page.url.pathname);
    isPodcasts = /^\/podcast/.test($page.url.pathname);
    isSettings = /^\/settings/.test($page.url.pathname);
    isBrowse = !(isPodcasts || isBookmarks || isSettings);
  }
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>
<Header {heading} {isBrowse} {isBookmarks} {isPodcasts} {isSettings} />
<Player />
<main class="container-fluid mb-5">
  {#if isBrowse}
    <Browse />
  {/if}
  <slot />
</main>
<Footer />
