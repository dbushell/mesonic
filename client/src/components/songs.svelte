<script>
  import {onDestroy, createEventDispatcher} from 'svelte';
  import {songStore, songListStore, bookmarkStore} from '../stores.js';
  import {formatTime} from '../utils.js';
  import Headphones from '../icons/headphones.svelte';

  const dispatch = createEventDispatcher();

  let song;
  let isError = false;
  let isLoading = true;
  let songs = [];
  let bookmarks = [];
  let unsubscribe = [];

  onDestroy(() => {
    unsubscribe.forEach((fn) => fn());
  });

  unsubscribe.push(
    songStore.subscribe((state) => {
      song = state;
    })
  );

  unsubscribe.push(
    songListStore.subscribe((store) => {
      isLoading = store === 'loading';
      isError = store === 'error';
      if (!isError && !isLoading) {
        songs = [...store];
      }
    })
  );

  unsubscribe.push(
    bookmarkStore.subscribe((store) => {
      bookmarks = [...store];
    })
  );

  $: {
    bookmarks.forEach((bookmark) => {
      songs.find((song, i) => {
        if (song.id === bookmark?.entry[0]?.id) {
          songs[i].bookmark = bookmark;
          return true;
        }
      });
    });
  }
</script>

<div class="list-group">
  <h2 class="visually-hidden">Songs</h2>
  {#if isError}
    <div class="list-group-item text-danger border-danger">
      Failed to fetch songs
    </div>
  {:else if isLoading}
    <div class="list-group-item bg-light text-dark">Loading…</div>
  {:else}
    {#if songs.length === 0}
      <div class="list-group-item bg-light text-dark">No songs found</div>
    {/if}
    {#each songs as item (item.id)}
      <button
        on:click={() => dispatch('song', {...item})}
        type="button"
        class="list-group-item list-group-item-action d-flex flex-wrap justify-content-between align-items-center"
        class:text-primary={song && song.id === item.id}
      >
        <span>
          {#if song && song.id === item.id}<Headphones />{/if}
          {item.title}
        </span>
        <span class="badge bg-light text-dark">
          {formatTime(item.duration)}
        </span>
        {#if item?.bookmark?.progress}
          <div class="progress w-100 mt-2 mb-1" style="height: 2px;">
            <div
              class="progress-bar bg-success"
              role="progressbar"
              style="width: {item?.bookmark?.progress}%;"
              aria-valuenow={Math.round(item?.bookmark?.progress)}
              aria-valuemin="0"
              aria-valuemax="100"
            />
          </div>
        {/if}
      </button>
    {/each}
  {/if}
</div>
