<script>
  import {onDestroy, createEventDispatcher} from 'svelte';
  import {
    songStore,
    nextSongStore,
    bookmarkStore,
    playbackStore
  } from '../stores.js';
  import {createBookmark, deleteBookmark} from '../actions.js';
  import {formatTime} from '../utils.js';
  import RewindButton from './rewind.svelte';
  import ForwardButton from './forward.svelte';
  import PauseButton from './pause.svelte';
  import PlayButton from './play.svelte';

  const dispatch = createEventDispatcher();

  let audio;
  let song;
  let nextSong;
  let bookmarks = [];
  let seekingTimeout;
  let seekTimeout;
  let onLoadedPosition = 0;
  let playbackRate = 1.0;
  let isPlaying = false;
  let isSeeking = false;
  let isLoaded = false;
  let rangeValue = 0;
  let rangeMax = 0;
  let rangeNow;
  let rangeStart = '00:00';
  let rangeEnd = '00:00';
  const unsubscribe = [];

  $: {
    rangeNow = formatTime(rangeValue);
    rangeEnd = formatTime(rangeMax - rangeValue);
  }

  onDestroy(() => {
    unsubscribe.forEach((fn) => fn());
  });

  const resetAudio = () => {
    isLoaded = false;
    isSeeking = false;
    isPlaying = false;
    rangeValue = 0;
    rangeMax = 0;
    rangeStart = '00:00';
    rangeEnd = '00:00';
    if (audio) {
      audio.currentTime = 0;
    }
  };

  const setBookmark = () => {
    if (song && audio) {
      const position = Number.parseInt(audio.currentTime * 1000, 10);
      if (position !== onLoadedPosition) {
        createBookmark({id: song.id, position});
      }
    }
  };

  unsubscribe.push(
    playbackStore.subscribe((playback) => {
      if ('rate' in playback) {
        playbackRate = Number.parseFloat(playback.rate);
        if (audio) {
          audio.playbackRate = playbackRate;
        }
      }
    })
  );

  unsubscribe.push(
    songStore.subscribe((newSong) => {
      if (song && newSong) {
        if (song.id !== newSong.id) {
          if (isPlaying) {
            setBookmark();
          }
          song = newSong;
          resetAudio();
        }
      } else if (newSong) {
        song = newSong;
        resetAudio();
      }
    })
  );

  unsubscribe.push(
    nextSongStore.subscribe((value) => {
      nextSong = value;
    })
  );

  unsubscribe.push(
    bookmarkStore.subscribe((state) => {
      if (Array.isArray(state)) {
        bookmarks = [...state];
      }
    })
  );

  const onLoaded = (ev) => {
    if (isLoaded) {
      return;
    }
    isLoaded = true;
    rangeMax = Math.round(audio.duration);
    rangeEnd = formatTime(rangeMax);
    audio.playbackRate = playbackRate;
    onLoadedPosition = 0;
    bookmarks.find((bookmark) => {
      const isFound = bookmark?.entry[0]?.id === song.id;
      if (isFound) {
        onLoadedPosition = bookmark.position;
        audio.currentTime = onLoadedPosition / 1000;
      }
      return isFound;
    });
    if (song.autoplay) {
      song.autoplay = false;
      audio.currentTime = 0;
      audio.play();
    }
  };

  const onTimeUpdate = () => {
    rangeValue = Math.round(audio.currentTime);
    rangeStart = rangeNow;
  };

  const onPlay = () => {
    isPlaying = true;
  };

  const onPause = () => {
    isPlaying = false;
    if (!audio.ended) {
      setBookmark();
    }
  };

  const onSeeked = () => {
    rangeStart = rangeNow;
    clearTimeout(seekTimeout);
    if (!audio.ended) {
      seekTimeout = setTimeout(setBookmark, 1000);
    }
  };

  const onEnded = () => {
    isPlaying = false;
    deleteBookmark({id: song.id});
    if (nextSong) {
      dispatch('song', {...nextSong, autoplay: true});
    }
  };

  const onRangeInput = () => {
    isSeeking = true;
    clearTimeout(seekingTimeout);
    seekingTimeout = setTimeout(() => (isSeeking = false), 500);
  };

  const onRangeChange = (ev) => {
    audio.currentTime = ev.target.value;
  };

  const onBeforeUnload = (ev) => {
    if (isPlaying) {
      audio.pause();
      ev.preventDefault();
      return (ev.returnValue = '...');
    }
  };
</script>

<svelte:window on:beforeunload|capture={onBeforeUnload} />
<aside
  class="container-fluid mt-0 mb-3 pt-4 pb-3 bg-white border-bottom"
  style="position: sticky; top: 0; z-index: 99;"
>
  <div class="mb-2 d-flex flex-wrap align-items-center">
    <h2 class="visually-hidden">Audio Player</h2>
    {#if song}
      <p class="h6 lh-base m-0 me-auto">
        {isLoaded ? '' : 'Loading: '}{song.title}
      </p>
      <div class="d-flex flex-wrap">
        <button
          on:click={() => dispatch('artist', {id: song.artistId})}
          class="btn btn-link text-dark p-0 fs-7 fw-normal me-2"
          type="button"
        >
          {song.artist}
        </button>
        <button
          on:click={() => dispatch('album', {id: song.albumId})}
          class="btn btn-link text-dark p-0 fs-7 fw-normal"
          type="button"
        >
          {song.album}
        </button>
      </div>
    {:else}
      <p class="h6 lh-base m-0 text-dark">Not playing…</p>
    {/if}
  </div>
  <div class="mb-2" style="position: relative;">
    <input
      type="range"
      class="form-range"
      bind:value={rangeValue}
      on:change={onRangeChange}
      on:input={onRangeInput}
      disabled={!isLoaded}
      max={rangeMax}
    />
    {#if isSeeking}
      <div
        role="tooltip"
        class="popover bs-popover-top bg-secondary text-secondary"
        style="--range-value: {rangeValue}; --range-max: {rangeMax}; --offset: calc((100% - 1em) / var(--range-max) * var(--range-value)); pointer-events: none; position: absolute; bottom: 100%; top: auto; z-index: 1; left: var(--offset); transform: translateX(calc(-50% + 0.5em));"
      >
        <div
          class="popover-arrow"
          style="position: absolute; transform: translateX(-50%); left: 50%; top: 100%;"
        />
        <div class="popover-body text-white fs-7 p-1 px-2">{rangeNow}</div>
      </div>
    {/if}
    <div
      aria-hidden={!isLoaded}
      class="d-flex justify-content-between"
      style="margin-top: -0.5rem;"
    >
      <p class="text-dark m-0">
        <span class="visually-hidden">Current time</span>
        <span class="fs-7 fw-light">{rangeStart}</span>
      </p>
      <p class="text-dark m-0">
        <span class="visually-hidden">Duration</span>
        <span class="fs-7 fw-light">-&thinsp;{rangeEnd}</span>
      </p>
    </div>
  </div>
  <div class="btn-toolbar justify-content-center">
    <div class="btn-group" role="toolbar" aria-label="Playback controls">
      <RewindButton
        isDisabled={!isLoaded}
        on:click={() => (audio.currentTime -= 30)}
      />
      {#if isPlaying}
        <PauseButton isDisabled={!isLoaded} on:click={() => audio.pause()} />
      {:else}
        <PlayButton isDisabled={!isLoaded} on:click={() => audio.play()} />
      {/if}
      <ForwardButton
        isDisabled={!isLoaded}
        on:click={() => (audio.currentTime += 30)}
      />
    </div>
  </div>
  {#if song}
    <audio
      bind:this={audio}
      {playbackRate}
      on:timeupdate={onTimeUpdate}
      on:seeked={onSeeked}
      on:pause={onPause}
      on:play={onPlay}
      on:ended={onEnded}
      on:loadeddata={onLoaded}
      on:loadedmetadata={onLoaded}
      on:canplay={onLoaded}
      on:canplaythrough={onLoaded}
      on:suspend={(ev) => console.log(ev)}
      on:stalled={(ev) => console.log(ev)}
      on:waiting={(ev) => console.log(ev)}
      on:error={(ev) => console.log(ev)}
      src={song.stream}
      preload="metadata"
      type="audio/mp3"
    />
  {/if}
</aside>
