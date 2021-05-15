<script>
  import {createEventDispatcher} from 'svelte';
  import Browse from '../icons/browse.svelte';
  import Settings from '../icons/settings.svelte';
  import Bookmarks from '../icons/bookmarks.svelte';

  const dispatch = createEventDispatcher();

  export let heading;
  export let activeTab;

  const browseTabs = ['artists', 'albums', 'songs'];
</script>

<header class="navbar border-bottom pb-0">
  <nav class="container-fluid align-items-end">
    <h1 class="navbar-brand mb-1">
      <a
        on:click|preventDefault={() => dispatch('tab', 'artists')}
        class="d-flex align-items-center text-decoration-none"
        href="/"
      >
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
        <button
          on:click={() => dispatch('tab', 'artists')}
          type="button"
          class="nav-link"
          class:active={browseTabs.includes(activeTab.id)}
          aria-current={browseTabs.includes(activeTab.id) !== 'settings'
            ? 'page'
            : 'false'}
        >
          <Browse />
          <span class="visually-hidden">Browse</span>
        </button>
      </li>
      <li class="nav-item">
        <button
          on:click={() => dispatch('tab', 'bookmarks')}
          type="button"
          class="nav-link"
          class:active={activeTab.id === 'bookmarks'}
          aria-current={activeTab.id === 'bookmarks' ? 'page' : 'false'}
        >
          <Bookmarks />
          <span class="visually-hidden">Bookmarks</span>
        </button>
      </li>
      <li class="nav-item">
        <button
          on:click={() => dispatch('tab', 'settings')}
          type="button"
          class="nav-link"
          class:active={activeTab.id === 'settings'}
          aria-current={activeTab.id === 'settings' ? 'page' : 'false'}
        >
          <Settings />
          <span class="visually-hidden">Settings</span>
        </button>
      </li>
    </ul>
  </nav>
</header>
