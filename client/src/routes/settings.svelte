<script>
  import {goto} from '$app/navigation';
  import {onDestroy} from 'svelte';
  import {
    appStore,
    authStore,
    serverStore,
    playbackStore,
    scanStore,
    updateServer,
    getScanStatus
  } from '../stores.js';

  let rate;
  let isMesonic = false;
  let isOffline = false;
  let isError = false;
  let scan = {};
  const unsubscribe = [];

  onDestroy(() => {
    unsubscribe.forEach((fn) => fn());
  });

  unsubscribe.push(
    appStore.subscribe((state) => {
      isMesonic = Boolean(state.isMesonic);
    })
  );

  unsubscribe.push(
    playbackStore.subscribe((state) => {
      rate = state.rate;
      isOffline = Boolean(state.isOffline);
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

  const onRateChange = (ev) => {
    playbackStore.set({
      ...$playbackStore,
      rate: String(ev.target.value).padEnd(3, '.0')
    });
  };

  const onOfflineChange = (ev) => {
    playbackStore.set({
      ...$playbackStore,
      isOffline: Boolean(ev.target.checked)
    });
  };

  const onSettings = async (ev) => {
    ev.preventDefault();
    isError = false;
    const data = new FormData(ev.target);
    authStore.set({
      username: data.get('username'),
      password: data.get('password')
    });
    const isSuccess = await updateServer(data.get('server'));
    if (isSuccess) {
      goto('/');
    } else {
      document.querySelector('#server').focus();
      isError = true;
    }
  };
</script>

<h2 class="text-secondary mb-3 fs-3">Settings</h2>
<p class="mb-1" id="playback-rate">Playback rate</p>
<div
  class="d-flex justify-content-between align-items-center"
  aria-hidden="true"
>
  <p class="text-dark m-0">
    <span class="fs-7 fw-light font-monospace">1.0</span>
  </p>
  <p class="m-0 fs-6 text-success d-inline-flex align-items-center">
    <span class="ms-1 font-monospace">{rate}</span>
    <span>&times;</span>
  </p>
  <p class="text-dark text-end m-0 ">
    <span class="fs-7 fw-light font-monospace">2.0</span>
  </p>
</div>
<input
  type="range"
  class="form-range d-block text-success"
  style="--range-color: var(--bs-green);"
  aria-labelledby="playback-rate"
  max="2"
  min="1"
  step="0.1"
  value={rate}
  on:change={onRateChange}
  on:input={onRateChange}
/>
{#if isMesonic}
  <div class="mt-4 pt-4 border-top">
    <div class="form-check form-switch">
      <input
        type="checkbox"
        class="form-check-input"
        id="playback-offline"
        checked={isOffline}
        on:input={onOfflineChange}
      />
      <label
        class="form-check-label"
        class:text-primary={isOffline}
        for="playback-offline"
      >
        Offline mode
      </label>
    </div>
  </div>
{/if}
<form on:submit={onSettings} method="POST" class="mt-4 pt-4 border-top">
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
      for="password"
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
