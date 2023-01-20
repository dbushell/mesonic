<script>
  import {onDestroy} from 'svelte';
  import {artistStore, songStore} from '../stores.js';
  import Headphones from '../icons/headphones.svelte';
  import Folder from '../icons/folder.svelte';

  export let data;
  $: ({artists} = data);

  let artist;
  let song;
  let unsubscribe = [];

  onDestroy(() => {
    unsubscribe.forEach((fn) => fn());
  });

  unsubscribe.push(
    artistStore.subscribe((state) => {
      artist = state;
    })
  );

  unsubscribe.push(
    songStore.subscribe((state) => {
      song = state;
    })
  );
</script>

<h2 class="visually-hidden">Artists</h2>
<div class="list-group">
  {#if artists.length === 0}
    <div class="list-group-item text-danger border-danger">
      Failed to fetch artists
    </div>
  {:else}
    {#each artists as item (item.id)}
      <a
        href="/{item.id}"
        class="list-group-item list-group-item-action d-flex justify-content-between align-items-start pe-2"
        class:text-primary={song && song.artistId === item.id}
      >
        <span class="lh-sm">
          {#if song && song.artistId === item.id}
            <Headphones />
          {:else if artist && artist.id === item.id}
            <Folder />
          {/if}
          {item.name}
        </span>
        <span class="badge bg-light text-dark font-monospace ms-1">
          {item.albumCount}
        </span>
      </a>
    {/each}
  {/if}
</div>
