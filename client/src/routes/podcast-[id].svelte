<script context="module">
  import {fetchEpisodes} from '../stores.js';

  export const load = async ({fetch, params}) => {
    const props = {fetch, id: params.id};
    return {
      props: {
        episodes: await fetchEpisodes(props)
      }
    };
  };
</script>

<script>
  import {onDestroy} from 'svelte';
  import {serverStore, songStore, bookmarkStore} from '../stores.js';
  import {formatDate, formatTime} from '../utils.js';
  import Headphones from '../icons/headphones.svelte';
  import Check from '../icons/check.svelte';

  export let episodes = [];

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

  $: {
    episodes.map((song, i) => {
      episodes[i].progress = 0;
      $bookmarkStore.find((item) => {
        if (
          song.id === item?.entry[0]?.id &&
          song.type === item?.entry[0]?.type
        ) {
          episodes[i].progress = item.progress;
          return true;
        }
      });
    });
  }

  const onSong = (song) => {
    songStore.set(song);
  };
</script>

<h2 class="mb-3 fs-3">
  <a href="/podcasts" class="text-secondary text-decoration-none">Episodes</a>
</h2>
<div class="list-group">
  {#if episodes.length === 0}
    <div class="list-group-item bg-light text-dark">No episodes found</div>
  {:else}
    {#each episodes as item (item.id)}
      <button
        on:click={onSong({...item})}
        type="button"
        class="list-group-item list-group-item-action px-2 {song &&
        song.id === item.id
          ? 'text-primary'
          : item?.meta?.played
          ? 'text-success'
          : ''}"
      >
        <div class="d-flex">
          <img
            alt={item.album}
            src={new URL(`/rest/getCoverArt.view?id=${item.coverArt}`, server)}
            class="rounded overflow-hidden flex-shrink-0 me-2"
            width="40"
            height="40"
            loading="lazy"
          />
          <div class="flex-grow-1">
            <div class="d-flex justify-content-between align-items-start">
              <span class="lh-sm">
                {#if song && song.id === item.id}
                  <Headphones />
                {:else if item?.meta?.played}
                  <Check />
                {/if}
                {item.title}
              </span>
              {#if item.duration}
                <span class="badge bg-light text-dark font-monospace ms-1">
                  {formatTime(item.duration)}
                </span>
              {/if}
            </div>
            <time
              class="fs-7 text-dark"
              datetime={new Date(item.modified).toISOString()}
            >
              {formatDate(new Date(item.modified))}
            </time>
          </div>
        </div>
        {#if item.progress}
          <div class="progress w-100 mt-2 mb-1" style="height: 0.125rem;">
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
      </button>
    {/each}
  {/if}
</div>
