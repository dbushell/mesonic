<script>
  import {onDestroy} from 'svelte';
  import {songStore, bookmarkStore} from '../../stores.js';
  import {formatTime} from '../../utils.js';
  import Headphones from '../../icons/headphones.svelte';

  export let data;
  $: ({songs} = data);

  let song;
  let unsubscribe = [];

  onDestroy(() => {
    unsubscribe.forEach((fn) => fn());
  });

  unsubscribe.push(
    songStore.subscribe((state) => {
      song = state;
    })
  );

  $: {
    songs.map((song, i) => {
      songs[i].progress = 0;
      $bookmarkStore.find((item) => {
        if (
          song.id === item?.entry[0]?.id &&
          song.type === item?.entry[0]?.type
        ) {
          songs[i].progress = item.progress;
          return true;
        }
      });
    });
  }

  const onSong = (song) => {
    songStore.set(song);
  };
</script>

<h2 class="visually-hidden">Songs</h2>
<div class="list-group">
  {#if songs.length === 0}
    <div class="list-group-item text-danger border-danger">
      Failed to fetch songs
    </div>
  {:else}
    {#each songs as item (item.id)}
      <button
        on:click={onSong({...item})}
        type="button"
        class="list-group-item list-group-item-action pe-2"
        class:text-primary={song && song.id === item.id}
      >
        <div class="d-flex justify-content-between align-items-start">
          <span class="lh-sm">
            {#if song && song.id === item.id}<Headphones />{/if}
            {item.title}
          </span>
          <span class="badge bg-light text-dark font-monospace ms-1">
            {formatTime(item.duration)}
          </span>
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
