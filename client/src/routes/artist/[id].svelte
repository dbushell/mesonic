<script context="module">
  import {browser} from '$app/env';
  import {fetchAlbums} from '../../stores.js';

  export const load = async ({fetch, page, session}) => {
    const props = {id: page.params.id};
    if (session.isStatic && !browser) {
      props.fetch = fetch;
    }
    return {
      props: {
        albums: await fetchAlbums(props)
      }
    };
  };
</script>

<script>
  import {onDestroy} from 'svelte';
  import {albumStore, songStore} from '../../stores.js';
  import {formatTime} from '../../utils.js';
  import Headphones from '../../icons/headphones.svelte';
  import Folder from '../../icons/folder.svelte';

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

<div class="list-group">
  <h2 class="visually-hidden">Albums</h2>
  {#if albums.length === 0}
    <div class="list-group-item text-danger border-danger">
      Failed to fetch albums
    </div>
  {:else}
    {#each albums as item (item.id)}
      <a
        href="/album/{item.id}"
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
      </a>
    {/each}
  {/if}
</div>
