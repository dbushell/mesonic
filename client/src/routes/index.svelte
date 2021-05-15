<script context="module">
  import {browser} from '$app/env';
  import {serverStore, playbackStore} from '../stores.js';
  if (browser) {
    let server = new URL(globalThis.MESONIC_HOST);
    try {
      const storedState = globalThis.localStorage.getItem('server');
      if (storedState) {
        server = new URL(storedState);
      }
    } catch (err) {}
    serverStore.set(server);
    // Playback settings
    try {
      let playback = globalThis.localStorage.getItem('playback');
      playback = JSON.parse(playback);
      if ('rate' in playback) {
        playbackStore.set(playback);
      }
    } catch (err) {}
    playbackStore.subscribe((playback) => {
      globalThis.localStorage?.setItem('playback', JSON.stringify(playback));
    });
  }
</script>

<script>
  import Header from '../components/header.svelte';
  import Footer from '../components/footer.svelte';
  import Main from '../components/main.svelte';
  import Player from '../components/player.svelte';
  import {
    addServerParams,
    artistStore,
    albumStore,
    songStore
  } from '../stores.js';

  const heading = `meSonic`;

  let activeTab;
  const tabs = [
    {
      id: 'artists',
      label: 'Artists',
      isActive: true
    },
    {
      id: 'albums',
      label: 'Albums',
      isDisabled: true
    },
    {
      id: 'songs',
      label: 'Tracks',
      isDisabled: true
    },
    {
      id: 'bookmarks',
      label: 'Bookmarks',
      isVisible: false
    },
    {
      id: 'settings',
      label: 'Settings',
      isVisible: false
    }
  ];

  $: {
    activeTab = tabs.find((tab) => tab.isActive);
  }

  serverStore.subscribe((server) => {
    if (server instanceof URL) {
      globalThis.localStorage?.setItem('server', server.toString());
    }
    songStore.set(null);
    albumStore.set(null);
    artistStore.set(null);
    tabs.forEach((tab, i) => {
      tabs[i].isActive = i === 0;
      tabs[i].isDisabled = i !== 0;
    });
  });

  const onTab = ({detail: id}) => {
    tabs.forEach((tab, i) => {
      tabs[i].isActive = tab.id === id;
    });
  };

  const onArtist = (ev) => {
    const {detail: newArtist} = ev;
    tabs.forEach((tab, i) => {
      tabs[i].isActive = false;
      if (tab.id === 'albums') {
        tabs[i].isActive = true;
        tabs[i].isDisabled = false;
      }
    });
    artistStore.set(newArtist);
  };

  const onAlbum = (ev) => {
    const {detail: newAlbum} = ev;
    activeTab = false;
    tabs.forEach((tab, i) => {
      tabs[i].isActive = false;
      if (tab.id === 'songs') {
        tabs[i].isActive = true;
        tabs[i].isDisabled = false;
      }
    });
    albumStore.set(newAlbum);
  };

  const onSong = async (ev) => {
    const {detail: newSong} = ev;
    if (!/^http/.test(newSong.stream)) {
      const url = new URL('/rest/stream.view', $serverStore);
      url.searchParams.set('id', newSong.id);
      await addServerParams(url);
      newSong.stream = url.href;
    }
    songStore.set(newSong);
  };
</script>

<svelte:head>
  <title>{heading}</title>
</svelte:head>
<Header {heading} {activeTab} on:tab={onTab} />
<Player on:artist={onArtist} on:album={onAlbum} on:song={onSong} />
<Main
  {tabs}
  {activeTab}
  on:tab={onTab}
  on:artist={onArtist}
  on:album={onAlbum}
  on:song={onSong}
/>
<Footer />
