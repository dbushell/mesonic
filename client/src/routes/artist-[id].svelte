<script context="module">
  import {fetchAlbums} from '../stores.js';

  export const load = async ({fetch, page}) => {
    const props = {fetch, id: page.params.id};
    return {
      props: {
        albums: await fetchAlbums(props)
      }
    };
  };
</script>

<script>
  import {onDestroy} from 'svelte';
  import {albumStore, songStore} from '../stores.js';
  import {formatTime} from '../utils.js';
  import Headphones from '../icons/headphones.svelte';
  import Folder from '../icons/folder.svelte';

  export let albums = [];

  let song;
  let album;
  let unsubscribe = [];

  onDestroy(() => {
    unsubscribe.forEach((fn) => fn());
  });

  unsubscribe.push(
    albumStore.subscribe((state) => {
      album = state;
    })
  );

  unsubscribe.push(
    songStore.subscribe((state) => {
      song = state;
    })
  );
</script>

<h2 class="visually-hidden">Albums</h2>
<div class="list-group">
  {#if albums.length === 0}
    <div class="list-group-item text-danger border-danger">
      Failed to fetch albums
    </div>
  {:else}
    {#each albums as item (item.id)}
      <a
        href="/{item.id}"
        class="list-group-item list-group-item-action d-flex justify-content-between align-items-start pe-2"
        class:text-primary={song && song.albumId === item.id}
      >
        <span class="lh-sm">
          {#if song && song.albumId === item.id}
            <Headphones />
          {:else if album && album.id === item.id}
            <Folder />
          {/if}
          {item.name}
        </span>
        <span class="badge bg-light text-dark font-monospace ms-1">
          {item.duration ? formatTime(item.duration) : item.songCount}
        </span>
      </a>
    {/each}
  {/if}
</div>
