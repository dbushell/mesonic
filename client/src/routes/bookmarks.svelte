<script context="module">
  import {prerendering} from '$app/env';
  import {songStore, fetchBookmarks} from '../stores.js';

  export const load = async ({fetch}) => {
    const props = {};
    if (prerendering) {
      props.fetch = fetch;
    }
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

  const onDelete = async (id) => {
    if (window.confirm('Delete bookmark?')) {
      deleteBookmark({id});
    }
  };
</script>

<h2 class="visually-hidden">Bookmarks</h2>
<div class="list-group">
  {#if bookmarks.length === 0}
    <div class="list-group-item bg-light text-dark">No bookmarks found</div>
  {:else}
    {#each bookmarks as item (item.entry[0].id)}
      <article
        class="list-group-item d-flex flex-wrap justify-content-between align-items-center"
      >
        <h3 class="my-1 mb-1 h6 lh-base align-items-center">
          <span class="badge bg-light text-dark font-monospace align-text-top me-1">
            {formatTime(item.position / 1000)}
          </span>
          <span>{item.entry[0].title}</span>
        </h3>
        <div
          class="w-100 d-flex flex-wrap justify-content-between align-items-center"
        >
          <p class="fs-7 my-1 w-75">
            {item.entry[0].artist} – {item.entry[0].album}
          </p>
          <div class="d-flex my-1">
            <button
              on:click={() => onSong({...item.entry[0], autoplay: true})}
              type="button"
              class="btn me-2 btn-sm btn-outline-success"
            >
              Resume
            </button>
            <button
              on:click={() => onDelete(item.entry[0].id)}
              type="button"
              class="btn btn-sm btn-outline-danger"
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
