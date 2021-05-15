<script>
  import {createEventDispatcher} from 'svelte';
  import Rewind from '../icons/rewind.svelte';

  const dispatch = createEventDispatcher();

  export let isDisabled;
</script>

<button
  disabled={isDisabled}
  on:click={() => dispatch('click')}
  type="button"
  aria-label="Rewind 30 seconds"
  class="btn btn-outline-primary"
>
  <Rewind />
  <span
    class="fs-7"
    aria-hidden="true"
    style="margin-inline-start: 0.1rem; vertical-align: 0.1rem;">30</span
  >
</button>
