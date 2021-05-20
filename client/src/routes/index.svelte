<script context="module">
  import {prerendering} from '$app/env';
  import {fetchArtists} from '../stores.js';

  export const load = async ({fetch}) => {
    const props = {};
    if (prerendering) {
      props.fetch = fetch;
    }
    return {
      props: {
        artists: await fetchArtists(props)
      }
    };
  };
</script>

<script>
  import {onDestroy} from 'svelte';
  import {artistStore, songStore} from '../stores.js';
  import Headphones from '../icons/headphones.svelte';
  import Folder from '../icons/folder.svelte';

  export let artists = [];

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
        href="/artist/{item.id}"
        class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
        class:text-success={song && song.artistId === item.id}
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
      </a>
    {/each}
  {/if}
</div>
