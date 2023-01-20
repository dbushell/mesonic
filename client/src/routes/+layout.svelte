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
