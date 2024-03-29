<script>
  import {onDestroy} from 'svelte';
  import {
    songStore,
    nextSongStore,
    bookmarkStore,
    playbackStore,
    offlineStore,
    serverStore,
    addServerParams,
    createBookmark,
    deleteBookmark
  } from '../stores.js';
  import {getOffline, deleteOffline} from '../offline.js';
  import {formatTime} from '../utils.js';
  import Wifioff from '../icons/wifioff.svelte';
  import RewindButton from './rewind.svelte';
  import ForwardButton from './forward.svelte';
  import PauseButton from './pause.svelte';
  import PlayButton from './play.svelte';
  import Atom from './atom.svelte';

  let server;
  let audio;
  let song;
  let nextSong;
  let cached = [];
  let bookmarks = [];
  let bookmarkInterval;
  let seekingTimeout;
  let seekTimeout;
  let onLoadedPosition = 0;
  let playbackRate = 1.0;
  let isOffline = false;
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

  const resetAudio = () => {
    isLoaded = false;
    isSeeking = false;
    isPlaying = false;
    rangeValue = 0;
    rangeMax = 0;
    rangeStart = '00:00';
    rangeEnd = '00:00';
    clearTimeout(seekTimeout);
    clearInterval(bookmarkInterval);
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

  onDestroy(() => {
    unsubscribe.forEach((fn) => fn());
    resetAudio();
  });

  unsubscribe.push(serverStore.subscribe((value) => (server = value)));

  unsubscribe.push(
    playbackStore.subscribe((playback) => {
      isOffline = Boolean(playback?.isOffline);
      if ('rate' in playback) {
        playbackRate = Number.parseFloat(playback.rate);
        if (audio) {
          audio.playbackRate = playbackRate;
        }
      }
    })
  );

  unsubscribe.push(
    offlineStore.subscribe((state) => {
      cached = state.cached;
    })
  );

  unsubscribe.push(
    songStore.subscribe(async (newSong) => {
      if (!newSong) {
        song = null;
        resetAudio();
        return;
      }
      if (cached?.includes(newSong.id)) {
        const blob = await getOffline(newSong);
        if (blob) {
          newSong.stream = URL.createObjectURL(blob);
        }
      }
      if (!newSong.stream) {
        const url = await addServerParams(
          new URL(`/rest/stream.view?id=${newSong.id}`, server)
        );
        newSong.stream = url.href;
      }
      if (isOffline && !newSong.stream.startsWith('blob:')) {
        alert('Cannot play in offline mode');
        songStore.set(null);
        return;
      }
      if (song) {
        if (song.id !== newSong.id) {
          if (isPlaying) {
            setBookmark();
          }
          if (song.stream.startsWith('blob:')) {
            URL.revokeObjectURL(song.stream);
          }
          song = newSong;
          resetAudio();
        }
      } else {
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
    const bookmarked = bookmarks.find((item) => {
      if (
        song.id === item?.entry[0]?.id &&
        song.type === item?.entry[0]?.type
      ) {
        onLoadedPosition = item.position;
        audio.currentTime = onLoadedPosition / 1000;
        return true;
      }
    });
    if (song.autoplay) {
      song.autoplay = false;
      if (!bookmarked) {
        audio.currentTime = 0;
      }
      audio.play();
    }
  };

  const onTimeUpdate = () => {
    rangeValue = Math.round(audio.currentTime);
    rangeStart = rangeNow;
  };

  const onPlay = () => {
    isPlaying = true;
    bookmarkInterval = setInterval(() => {
      if (isPlaying) {
        setBookmark();
      } else {
        clearInterval(bookmarkInterval);
      }
    }, 60000);
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
    deleteBookmark(song);
    deleteOffline(song);
    if (nextSong) {
      songStore.set({...nextSong, autoplay: true});
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
  class="container-fluid mt-0 mb-3 py-3 bg-white border-bottom position-sticky top-0"
>
  <div class="d-flex flex-wrap align-items-center mb-1">
    <h2 class="visually-hidden">Audio Player</h2>
    {#if song}
      <p class="h6 lh-base m-0 me-auto">
        {#if song.coverArt}
          <img
            alt={song.title}
            src={new URL(`/rest/getCoverArt.view?id=${song.coverArt}`, server)}
            class="d-inline-block align-top rounded overflow-hidden me-1"
            width="24"
            height="24"
            loading="lazy"
          />
        {/if}
        {#if !isLoaded}
          <span role="status" class="spinner-border spinner-border-sm me-1">
            <span class="visually-hidden">Loading…</span>
          </span>
        {/if}
        {#if isOffline}<Wifioff />{/if}
        <span>{song.title}</span>
      </p>
      <div class="d-flex flex-wrap">
        <a href={`/${song.artistId}`} class="text-dark fs-7 me-2">
          {song.artist}
        </a>
        <a href={`/${song.albumId}`} class="text-dark fs-7">
          {song.album}
        </a>
      </div>
    {:else}
      <p class="h6 lh-base m-0 text-dark">
        {#if isOffline}
          <Wifioff />
          <span>Offline mode…</span>
        {:else}
          <span>Not playing…</span>
        {/if}
      </p>
    {/if}
  </div>
  <div
    class="position-relative mb-2"
    style="--range-value: {rangeValue}; --range-max: {rangeMax};"
  >
    <input
      type="range"
      class="form-range d-block"
      aria-label="progress"
      bind:value={rangeValue}
      on:change={onRangeChange}
      on:input={onRangeInput}
      disabled={!isLoaded}
      max={rangeMax}
    />
    {#if isSeeking}
      <div
        role="tooltip"
        class="popover bs-popover-top bg-secondary text-secondary border-secondary pe-none position-absolute bottom-100"
        style="--offset: calc((100% - 1em) / var(--range-max) * var(--range-value)); top: auto; left: var(--offset); transform: translateX(calc(-50% + 0.5em));"
      >
        <div
          class="popover-arrow position-absolute top-100 start-50 translate-middle-x"
        />
        <div class="popover-body text-white font-monospace fs-7 p-1 px-2">
          {rangeNow}
        </div>
      </div>
    {/if}
    <Atom {isPlaying} />
    <Atom {isPlaying} />
  </div>
  <div
    aria-hidden={!isLoaded}
    class="d-flex justify-content-between align-items-center player-toolbar"
  >
    <p class="text-dark m-0 order-1">
      <span class="visually-hidden">Current time</span>
      <span class="fs-7 fw-light font-monospace">{rangeStart}</span>
    </p>
    <p class="text-dark text-end m-0 order-3">
      <span class="visually-hidden">Duration</span>
      <span class="fs-7 fw-light font-monospace">-{rangeEnd}</span>
    </p>
    <div class="btn-toolbar justify-content-center order-2">
      <div
        class="btn-group flex-grow-1"
        aria-label="playback controls"
        role="toolbar"
      >
        <RewindButton
          isDisabled={!isLoaded}
          on:click={() => (audio.currentTime -= 15)}
        />
        {#if isPlaying}
          <PauseButton isDisabled={!isLoaded} on:click={() => audio.pause()} />
        {:else}
          <PlayButton isDisabled={!isLoaded} on:click={() => audio.play()} />
        {/if}
        <ForwardButton
          isDisabled={!isLoaded}
          on:click={() => (audio.currentTime += 15)}
        />
      </div>
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
      src={song.stream}
      preload="metadata"
      type="audio/mp3"
    />
  {/if}
</aside>
