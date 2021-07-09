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
  import {deleteBookmark, bookmarkStore} from '../stores.js';
  import {formatTime} from '../utils.js';

  export let bookmarks = [];

  let unsubBookmarks;

  unsubBookmarks = bookmarkStore.subscribe((state) => {
    bookmarks = state;
  });

  onDestroy(() => unsubBookmarks());

  const onSong = (nextSong) => {
    songStore.set({...nextSong});
  };

  const onDelete = async (song) => {
    if (window.confirm('Delete bookmark?')) {
      deleteBookmark(song);
    }
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
              src="/rest/getCoverArt.view?id={item.entry[0].coverArt}"
              class="d-inline-block align-top rounded me-1"
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
