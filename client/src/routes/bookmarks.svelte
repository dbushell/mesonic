<script context="module">
  import {songStore, fetchBookmarks} from '../stores.js';

  export const load = async ({fetch}) => {
    const props = {fetch};
    return {
      props: {
        bookmarks: await fetchBookmarks(props)
      }
    };
  };
</script>

<script>
  import {onDestroy} from 'svelte';
  import {
    addServerParams,
    appStore,
    bookmarkStore,
    deleteBookmark,
    offlineStore,
    playbackStore,
    serverStore
  } from '../stores.js';
  import {addOffline, deleteOffline} from '../offline.js';
  import {formatTime} from '../utils.js';
  import Download from '../icons/download.svelte';
  import Trash from '../icons/trash.svelte';

  export let bookmarks = [];

  let server;
  let cached = [];
  let downloads = {};
  let unsubscribe = [];
  let isOffline = false;
  let isMesonic = false;

  onDestroy(() => {
    unsubscribe.forEach((fn) => fn());
  });

  unsubscribe.push(serverStore.subscribe((value) => (server = value)));

  unsubscribe.push(
    appStore.subscribe((state) => {
      isMesonic = Boolean(state.isMesonic);
    })
  );

  unsubscribe.push(
    bookmarkStore.subscribe((state) => {
      bookmarks = state;
    })
  );

  unsubscribe.push(
    playbackStore.subscribe((playback) => {
      isOffline = Boolean(playback?.isOffline);
    })
  );

  unsubscribe.push(
    offlineStore.subscribe((state) => {
      cached = state.cached;
      downloads = state.downloads;
    })
  );

  const onSong = async (song) => {
    songStore.set({...song});
  };

  const onDelete = async (song) => {
    if (window.confirm('Delete bookmark?')) {
      deleteBookmark(song);
      deleteOffline(song);
    }
  };

  const onOffline = async (ev, song) => {
    const button = ev.target.closest('button');
    if (button) {
      button.disabled = true;
      button.blur();
    }
    const url = song.stream
      ? new URL(song.stream)
      : await addServerParams(
          new URL(`/rest/stream.view?id=${song.id}`, server)
        );
    addOffline({id: song.id, url});
  };

  const onDeleteOffline = async (song) => {
    deleteOffline(song);
  };
</script>

<h2 class="text-secondary mb-3 fs-3">Bookmarks</h2>
<div class="list-group">
  {#if bookmarks.length === 0}
    <div class="list-group-item bg-light text-dark">No bookmarks found</div>
  {:else}
    {#each bookmarks as item (item.entry[0].id)}
      <article
        class="list-group-item d-flex flex-wrap justify-content-between align-items-center"
      >
        <h3 class="mt-1 mb-0 h6 lh-base">
          {#if item.entry[0].coverArt}
            <img
              alt={item.entry[0].title}
              src={new URL(
                `/rest/getCoverArt.view?id=${item.entry[0].coverArt}`,
                server
              )}
              class="d-inline-block align-top rounded overflow-hidden me-1"
              width="24"
              height="24"
              loading="lazy"
            />
          {/if}
          <span>{item.entry[0].title}</span>
        </h3>
        <div
          class="w-100 d-flex flex-wrap justify-content-between align-items-center"
        >
          <p class="mb-0 my-1 w-75 d-flex flex-wrap align-items-center">
            <span class="badge bg-light text-dark font-monospace me-2">
              {formatTime(item.position / 1000)}
            </span>
            <a href={`/${item.entry[0].albumId}`} class="text-dark fs-7">
              {item.entry[0].album}
            </a>
          </p>
          <div class="d-flex mt-2 mb-1">
            {#if isMesonic}
              {#if cached?.includes(item.entry[0].id)}
                <button
                  on:click={() => onDeleteOffline({...item.entry[0]})}
                  class="btn me-2 btn-sm btn-outline-dark"
                  aria-label="remove offline download"
                  type="button"
                >
                  <Trash />
                </button>
              {:else}
                <button
                  on:click={(ev) => onOffline(ev, {...item.entry[0]})}
                  disabled={isOffline || Object.keys(downloads).includes(item.entry[0].id)}
                  class="btn me-2 btn-sm btn-outline-secondary"
                  aria-label="download for offline play"
                  type="button"
                >
                  <Download />
                </button>
              {/if}
            {/if}
            <button
              on:click={() => onSong({...item.entry[0], autoplay: true})}
              class="btn me-2 btn-sm btn-outline-success"
              type="button"
            >
              Resume
            </button>
            <button
              on:click={() => onDelete(item.entry[0])}
              class="btn btn-sm btn-outline-danger"
              type="button"
            >
              Delete
            </button>
          </div>
        </div>
        {#if Object.keys(downloads).includes(item.entry[0].id)}
          <div class="progress w-100 my-2" style="height: 0.125rem;">
            <div
              class="progress-bar bg-secondary"
              role="progressbar"
              style="width: {downloads[item.entry[0].id].progress}%;"
              aria-valuenow={Math.round(downloads[item.entry[0].id].progress)}
              aria-valuemin="0"
              aria-valuemax="100"
            />
          </div>
        {/if}
        {#if item.progress}
          <div class="progress w-100 my-2" style="height: 0.125rem;">
            <div
              class="progress-bar bg-success"
              role="progressbar"
              style="width: {item.progress}%;"
              aria-valuenow={Math.round(item.progress)}
              aria-valuemin="0"
              aria-valuemax="100"
            />
          </div>
        {/if}
      </article>
    {/each}
  {/if}
</div>
