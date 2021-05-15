<script>
  import {onDestroy, createEventDispatcher} from 'svelte';
  import {songStore, artistStore, artistListStore} from '../stores.js';
  import Headphones from '../icons/headphones.svelte';
  import Folder from '../icons/folder.svelte';

  const dispatch = createEventDispatcher();

  let song;
  let artist;
  let isError = false;
  let isLoading = true;
  let artists = [];
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
    artistStore.subscribe((state) => {
      artist = state;
    })
  );

  unsubscribe.push(
    artistListStore.subscribe((store) => {
      isLoading = store === 'loading';
      isError = store === 'error';
      if (!isError && !isLoading) {
        artists = [...store];
      }
    })
  );
</script>

<div class="list-group">
  <h2 class="visually-hidden">Artists</h2>
  {#if isError}
    <div class="list-group-item text-danger border-danger">
      Failed to fetch artists
    </div>
  {:else if isLoading}
    <div class="list-group-item bg-light text-dark">Loading…</div>
  {:else}
    {#if artists.length === 0}
      <div class="list-group-item bg-light text-dark">No artists found</div>
    {/if}
    {#each artists as item (item.id)}
      <button
        on:click={() => dispatch('artist', {...item})}
        type="button"
        class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
        class:text-primary={song && song.artistId === item.id}
      >
        <span>
          {#if song && song.artistId === item.id}
            <Headphones />
          {:else if artist && artist.id === item.id}
            <Folder />
          {/if}
          {item.name}
        </span>
        <span class="badge bg-light text-dark">
          {item.albumCount}
        </span>
      </button>
    {/each}
  {/if}
</div>
