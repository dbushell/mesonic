<script>
  import {createEventDispatcher} from 'svelte';
  import Bookmarks from '../components/bookmarks.svelte';
  import Settings from '../components/settings.svelte';
  import Artists from '../components/artists.svelte';
  import Albums from '../components/albums.svelte';
  import Songs from '../components/songs.svelte';

  const dispatch = createEventDispatcher();

  export let tabs;
  export let activeTab;
</script>

<main class="container-fluid mb-5">
  <div class="btn-toolbar mb-3">
    <div
      class="btn-group flex-grow-1"
      aria-label="Browse categories"
      role="toolbar"
    >
      {#each tabs as tab (tab.id)}
        {#if tab.isVisible !== false}
          <button
            on:click={() => dispatch('tab', tab.id)}
            type="button"
            disabled={tab.isDisabled}
            class:active={tab.isActive}
            class:btn-outline-dark={tab.isDisabled}
            class="btn btn-outline-secondary"
          >
            {tab.label}
          </button>
        {/if}
      {/each}
    </div>
  </div>
  {#if activeTab}
    {#if activeTab.id === 'artists'}
      <Artists on:artist />
    {/if}
    {#if activeTab.id === 'albums'}
      <Albums on:album />
    {/if}
    {#if activeTab.id === 'songs'}
      <Songs on:song />
    {/if}
    {#if activeTab.id === 'bookmarks'}
      <Bookmarks on:song />
    {/if}
    {#if activeTab.id === 'settings'}
      <Settings />
    {/if}
  {/if}
</main>
