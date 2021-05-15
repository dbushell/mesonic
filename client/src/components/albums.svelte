<script>
  import {onDestroy, createEventDispatcher} from 'svelte';
  import {songStore, albumStore, albumListStore} from '../stores.js';
  import {formatTime} from '../utils.js';
  import Headphones from '../icons/headphones.svelte';
  import Folder from '../icons/folder.svelte';

  const dispatch = createEventDispatcher();

  let isError = false;
  let isLoading = true;
  let song;
  let album;
  let albums = [];
  const unsubscribe = [];

  onDestroy(() => {
    unsubscribe.forEach((fn) => fn());
  });

  unsubscribe.push(
    songStore.subscribe((state) => {
      song = state;
    })
  );

  unsubscribe.push(
    albumStore.subscribe((state) => {
      album = state;
    })
  );

  unsubscribe.push(
    albumListStore.subscribe((store) => {
      isLoading = store === 'loading';
      isError = store === 'error';
      if (Array.isArray(store)) {
        albums = [...store];
      }
    })
  );
</script>

<div class="list-group">
  <h2 class="visually-hidden">Albums</h2>
  {#if isError}
    <div class="list-group-item text-danger border-danger">
      Failed to fetch albums
    </div>
  {:else if isLoading}
    <div class="list-group-item bg-light text-dark">Loading…</div>
  {:else}
    {#if albums.length === 0}
      <div class="list-group-item bg-light text-dark">No albums found</div>
    {/if}
    {#each albums as item (item.id)}
      <button
        on:click={() => dispatch('album', {...item})}
        type="button"
        class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
        class:text-primary={song && song.albumId === item.id}
      >
        <span>
          {#if song && song.albumId === item.id}
            <Headphones />
          {:else if album && album.id === item.id}
            <Folder />
          {/if}
          {item.name}
        </span>
        <span class="badge bg-light text-dark">
          {item.duration ? formatTime(item.duration) : item.songCount}
        </span>
      </button>
    {/each}
  {/if}
</div>
