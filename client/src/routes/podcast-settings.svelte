<script context="module">
  import {fetchPodcasts} from '../stores.js';

  export const load = async ({fetch}) => {
    const props = {fetch};
    return {
      props: {
        podcasts: await fetchPodcasts(props)
      }
    };
  };
</script>

<script>
  import {createPodcast, deletePodcast} from '../stores.js';

  export let podcasts = [];

  const refresh = async () => {
    podcasts = await fetchPodcasts();
  };

  const onPodcast = async (ev) => {
    ev.preventDefault();
    const field = ev.target.querySelector('[type="url"]');
    const button = ev.target.querySelector('[type="submit"]');
    button.disabled = true;
    const isSuccess = await createPodcast({url: field.value});
    if (isSuccess) {
      field.value = '';
      await refresh();
    } else {
      alert('Failed to add podcast');
      field.focus();
    }
    button.disabled = false;
  };

  const onDelete = async (id) => {
    if (window.confirm('Delete podcast?')) {
      await deletePodcast({id});
      await refresh();
    }
  };
</script>

<h2 class="mb-3 fs-3">
  <a href="/podcasts" class="text-secondary text-decoration-none">Podcasts</a>
</h2>
<div class="list-group">
  <form class="list-group-item py-3" method="POST" on:submit={onPodcast}>
    <div class="mb-3">
      <label for="podcast-0-url" class="form-label">New Podcast URL:</label>
      <input
        type="url"
        class="form-control"
        autocomplete="off"
        id="podcast-0-url"
        required
      />
    </div>
    <button class="btn btn-sm btn-outline-success" type="submit">
      Add New
    </button>
  </form>
  {#each podcasts as item (item.id)}
    <form class="list-group-item py-3">
      <div class="mb-3">
        <label for="{item.id}-url" class="form-label">{item.title}:</label>
        <input
          type="url"
          class="form-control form-control-sm"
          id="{item.id}-url"
          value={item.url}
          disabled
          required
        />
      </div>
      <button
        on:click={() => onDelete(item.id)}
        class="btn btn-sm btn-outline-danger"
        type="button"
      >
        Delete
      </button>
    </form>
  {/each}
</div>
