<script>
  import Browse from '../icons/browse.svelte';
  import Settings from '../icons/settings.svelte';
  import Bookmarks from '../icons/bookmarks.svelte';
  import Broadcast from '../icons/broadcast.svelte';

  export let heading;
  export let isBrowse;
  export let isBookmarks;
  export let isPodcasts;
  export let isSettings;
</script>

<header class="navbar border-bottom pb-0">
  <nav class="container-fluid align-items-end">
    <h1 class="navbar-brand py-1 mb-1 me-1">
      <a class="d-flex align-items-center text-decoration-none" href="/">
        <div class="me-1">
          <img
            src="/favicon.svg"
            role="presentation"
            alt="meSonic"
            width="30"
            height="30"
          />
        </div>
        <span>{heading}</span>
      </a>
    </h1>
    <ul class="nav nav-tabs justify-content-end">
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
          href="/podcasts"
          class="nav-link"
          class:active={isPodcasts}
          aria-current={isPodcasts ? 'page' : 'false'}
        >
          <Broadcast />
          <span class="visually-hidden">Podcasts</span>
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
