<script context="module">
  import cookie from 'cookie';
  import {browser} from '$app/env';
  import {
    fetchBookmarks,
    serverStore,
    proxyStore,
    playbackStore
  } from '../stores.js';

  export const load = async ({fetch, session}) => {
    let server;
    if (browser) {
      server = globalThis.localStorage.getItem('server');
    }
    if (server) {
      // Use server from browser storage
      serverStore.set(new URL(server));
    } else {
      proxyStore.set(null);
      // Use internal Docker server-side if hosts match
      if (!browser && session.internal) {
        proxyStore.set(new URL(session.internal));
      }
      // Use default or cookie defined server
      serverStore.set(new URL(session.server));
    }

    // Ensure all demo endpoints are rendered server-side
    if (session.isStatic && !browser) {
      await fetch('/demo/createBookmark.view');
      await fetch('/demo/deleteBookmark.view');
      await fetch('/demo/getScanStatus.view');
      await fetch('/demo/startScan.view');
      await fetch('/demo/ping.view');
      await fetchBookmarks({fetch});
    } else {
      await fetchBookmarks();
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

    return {};
  };
</script>

<script>
  import {page} from '$app/stores';
  import Header from '../components/header.svelte';
  import Footer from '../components/footer.svelte';
  import Player from '../components/player.svelte';
  import {artistStore, albumStore, songStore} from '../stores.js';

  const heading = `meSonic`;
  let title = heading;
  $: {
    if ($songStore) {
      title = `${heading} – ${$songStore.album}`;
    }
  }
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>
<Header {heading} />
<Player />
<main class="container-fluid mb-5">
  <div class="btn-toolbar mb-3">
    <div
      class="btn-group flex-grow-1"
      aria-label="Browse categories"
      role="toolbar"
    >
      <a
        href="/"
        class:active={$page.path === '/'}
        class="btn btn-outline-secondary"
      >
        Artists
      </a>
      <a
        href={$artistStore ? `/artist/${$artistStore.id}` : `/`}
        class:pe-none={!$artistStore}
        class:btn-outline-dark={!$artistStore}
        class:active={/^\/artist/.test($page.path)}
        class="btn btn-outline-secondary"
      >
        Albums
      </a>
      <a
        href={$albumStore ? `/album/${$albumStore.id}` : `/`}
        class:pe-none={!$albumStore}
        class:btn-outline-dark={!$albumStore}
        class:active={/^\/album/.test($page.path)}
        class="btn btn-outline-secondary"
      >
        Tracks
      </a>
    </div>
  </div>
  <slot />
</main>
<Footer />
