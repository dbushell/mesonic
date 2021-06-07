<script>
  import {page} from '$app/stores';
  import {artistStore, albumStore} from '../stores.js';
</script>

<div class="btn-toolbar mb-3">
  <div
    class="btn-group flex-grow-1"
    aria-label="browse categories"
    role="toolbar"
  >
    <a
      href="/"
      class:active={$page.path === '/'}
      class="btn btn-outline-secondary"
    >
      Artists
    </a>
    <a
      href={$artistStore ? `/${$artistStore.id}` : `/`}
      class:pe-none={!$artistStore}
      class:btn-outline-dark={!$artistStore}
      class:active={/^\/artist/.test($page.path)}
      class="btn btn-outline-secondary"
    >
      Albums
    </a>
    <a
      href={$albumStore ? `/${$albumStore.id}` : `/`}
      class:pe-none={!$albumStore}
      class:btn-outline-dark={!$albumStore}
      class:active={/^\/album/.test($page.path)}
      class="btn btn-outline-secondary"
    >
      Tracks
    </a>
  </div>
</div>
