<script>
  import {page} from '$app/stores';
  import Browse from '../icons/browse.svelte';
  import Settings from '../icons/settings.svelte';
  import Bookmarks from '../icons/bookmarks.svelte';

  export let heading;

  let isBookmarks;
  let isSettings;
  let isBrowse;

  $: {
    isBookmarks = /^\/bookmarks/.test($page.path);
    isSettings = /^\/settings/.test($page.path);
    isBrowse = !isBookmarks && !isSettings;
  }
</script>

<header class="navbar border-bottom pb-0">
  <nav class="container-fluid align-items-end">
    <h1 class="navbar-brand mb-1">
      <a class="d-flex align-items-center text-decoration-none" href="/">
        <img
          src="/favicon.svg"
          role="presentation"
          alt="meSonic"
          class="me-2"
          width="30"
          height="30"
        />
        <span>{heading}</span>
      </a>
    </h1>
    <ul class="nav nav-tabs justify-content-end" style="margin-bottom: -1px;">
      <li class="nav-item">
        <a
          href="/"
          class="nav-link"
          class:active={isBrowse}
          aria-current={isBrowse ? 'page' : 'false'}
        >
          <Browse />
          <span class="visually-hidden">Browse</span>
        </a>
      </li>
      <li class="nav-item">
        <a
          href="/bookmarks"
          class="nav-link"
          class:active={isBookmarks}
          aria-current={isBookmarks ? 'page' : 'false'}
        >
          <Bookmarks />
          <span class="visually-hidden">Bookmarks</span>
        </a>
      </li>
      <li class="nav-item">
        <a
          href="/settings"
          class="nav-link"
          class:active={isSettings}
          aria-current={isSettings ? 'page' : 'false'}
        >
          <Settings />
          <span class="visually-hidden">Settings</span>
        </a>
      </li>
    </ul>
  </nav>
</header>
