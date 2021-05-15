<script>
  import {onDestroy, createEventDispatcher} from 'svelte';
  import {bookmarkStore} from '../stores.js';
  import {deleteBookmark} from '../actions.js';
  import {formatTime} from '../utils.js';

  const dispatch = createEventDispatcher();

  let isError = false;
  let isLoading = true;
  let bookmarks = [];
  const unsubscribe = [];

  onDestroy(() => {
    unsubscribe.forEach((fn) => fn());
  });

  unsubscribe.push(
    bookmarkStore.subscribe((store) => {
      isLoading = store === 'loading';
      isError = store === 'error';
      if (!isError && !isLoading) {
        bookmarks = [...store];
      }
    })
  );

  const onDelete = async (id) => {
    if (window.confirm('Delete bookmark?')) {
      deleteBookmark({id});
    }
  };
</script>

<div class="list-group">
  <h2 class="visually-hidden">Bookmarks</h2>
  {#if isError}
    <div class="list-group-item text-danger border-danger">
      Failed to fetch bookmarks
    </div>
  {:else if isLoading}
    <div class="list-group-item bg-light text-dark">Loading…</div>
  {:else}
    {#if bookmarks.length === 0}
      <div class="list-group-item bg-light text-dark">No bookmarks found</div>
    {/if}
    {#each bookmarks as item (item.entry[0].id)}
      <article
        class="list-group-item d-flex flex-wrap justify-content-between align-items-center"
      >
        <h3 class="my-1 mb-1 lh-base h6 d-flex align-items-center">
          <span class="badge bg-light text-dark me-2">
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
              on:click={() => dispatch('song', {...item.entry[0]})}
              type="button"
              class="btn me-2 btn-sm btn-outline-secondary"
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
          <div class="progress w-100 my-2" style="height: 2px;">
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
