<script context="module">
  import {fetchPodcasts} from '../stores.js';

  export const load = async ({fetch}) => {
    const props = {fetch};
    return {
      props: {
        podcasts: await fetchPodcasts(props)
      }
    };
  };
</script>

<script>
  import {onDestroy} from 'svelte';
  import {serverStore, songStore} from '../stores.js';
  import {formatDate} from '../utils.js';
  import Headphones from '../icons/headphones.svelte';

  export let podcasts = [];

  let server;
  let song;
  let unsubscribe = [];

  onDestroy(() => {
    unsubscribe.forEach((fn) => fn());
  });

  unsubscribe.push(serverStore.subscribe((value) => (server = value)));

  unsubscribe.push(
    songStore.subscribe((state) => {
      song = state;
    })
  );
</script>

<h2 class="mb-3 fs-3">
  <a href="/podcasts" class="text-secondary text-decoration-none">Podcasts</a>
</h2>
<div class="list-group">
  {#if podcasts.length === 0}
    <div class="list-group-item bg-light text-dark">No podcasts found</div>
  {:else}
    {#each podcasts as item (item.id)}
      <a
        href="/{item.id}"
        class="list-group-item list-group-item-action px-2 d-flex"
        class:text-primary={song && song.albumId === item.id}
      >
        <img
          alt={item.title}
          src={new URL(`/rest/getCoverArt.view?id=${item.coverArt}`, server)}
          class="rounded overflow-hidden flex-shrink-0 me-2"
          width="40"
          height="40"
          loading="lazy"
        />
        <div class="flex-grow-1">
          <div class="d-flex justify-content-between align-items-start">
            <span class="lh-sm">
              {#if song && song.albumId === item.id}
                <Headphones />
              {/if}
              {item.title}
            </span>
            <span class="badge bg-light text-dark font-monospace ms-1">
              {item.episodeCount}
            </span>
          </div>
          <time
            class="fs-7 text-dark"
            datetime={new Date(item.modified).toISOString()}
          >
            {formatDate(new Date(item.modified))}
          </time>
        </div>
      </a>
    {/each}
  {/if}
</div>
<div class="mt-2 text-center">
  <a href="/podcast-settings" class="btn btn-link">Edit Podcasts</a>
</div>
