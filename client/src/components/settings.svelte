<script>
  import {onDestroy} from 'svelte';
  import {
    addServerParams,
    authStore,
    serverStore,
    playbackStore,
    scanStore
  } from '../stores.js';
  import {getScanStatus} from '../actions.js';

  const rates = ['1.0', '1.2', '1.4', '1.6', '1.8', '2.0'];
  let rate = '1.0';
  let isError = false;
  let scan = {};
  const unsubscribe = [];

  onDestroy(() => {
    unsubscribe.forEach((fn) => fn());
  });

  unsubscribe.push(
    playbackStore.subscribe((state) => {
      rate = state.rate;
    })
  );

  unsubscribe.push(
    scanStore.subscribe((state) => {
      scan = {...state};
    })
  );

  const onScan = (ev) => {
    ev.target.closest('button').blur();
    getScanStatus();
  };

  const onRateChange = (rate) => {
    playbackStore.set({...$playbackStore, rate});
  };

  const onSettings = async (ev) => {
    ev.preventDefault();
    isError = false;
    const data = new FormData(ev.target);
    authStore.set({
      username: data.get('username'),
      password: data.get('password')
    });
    try {
      const server = new URL(data.get('server'));
      let url = new URL('/rest/ping.view', server);
      await addServerParams(url);
      const response = await fetch(url);
      const json = await response.json();
      if (json['subsonic-response'].status === 'ok') {
        serverStore.set(server);
        return;
      }
      throw new Error('Server not responding');
    } catch (err) {
      console.log(err);
      document.querySelector('#server').focus();
      isError = true;
    }
  };
</script>

<div class="pt-2 mb-4">
  <p class="mb-2" id="playback-rate">Playback rate</p>
  <div class="btn-group d-flex" role="toolbar" aria-labelledby="playback-rate">
    {#each rates as item}
      <button
        type="button"
        on:click={() => onRateChange(item)}
        class="btn"
        class:btn-outline-secondary={item !== rate}
        class:btn-secondary={item === rate}
        aria-selected={item === rate}
      >
        {item}
      </button>
    {/each}
  </div>
</div>
<form method="POST" on:submit={onSettings}>
  <div class="mb-3">
    <label
      for="server"
      class="form-label d-flex flex-wrap align-items-baseline justify-content-between"
    >
      <span class="me-2">Server</span>
      <span class="fs-7 fw-light text-dark">(required)</span>
    </label>
    <input
      type="url"
      class="form-control"
      class:text-danger={isError}
      class:border-danger={isError}
      id="server"
      name="server"
      placeholder="http://"
      value={$serverStore.href}
      required
    />
  </div>
  <div class="mb-3">
    <label
      for="username"
      class="form-label d-flex flex-wrap align-items-baseline justify-content-between"
    >
      <span class="me-2">Username</span>
      <span class="fs-7 fw-light text-dark">(optional)</span>
    </label>
    <input
      type="text"
      class="form-control"
      id="username"
      name="username"
      autoComplete="username"
      value={$authStore.username}
    />
  </div>
  <div class="mb-3">
    <label
      for="username"
      class="form-label d-flex flex-wrap align-items-baseline justify-content-between"
    >
      <span class="me-2">Password</span>
      <span class="fs-7 fw-light text-dark">(optional)</span>
    </label>
    <input
      type="password"
      class="form-control"
      id="password"
      name="password"
      autoComplete={'current-password'}
      value={$authStore.password}
    />
  </div>
  <button type="submit" class="btn btn-primary">Connect</button>
</form>
<div class="mt-4 pt-4 border-top d-flex flex-column">
  <button
    on:click={onScan}
    disabled={scan.scanning}
    class="btn btn-outline-success"
    type="button"
  >
    <span>{scan.scanning ? 'Scanning…' : 'Scan Media'}</span>
  </button>
  {#if scan.count}
    <p class="mt-2 mb-0 text-dark text-center">{scan.count}</p>
  {/if}
</div>
