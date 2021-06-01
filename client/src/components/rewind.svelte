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
  aria-label="rewind 30 seconds"
  class="btn btn-outline-primary text-nowrap"
>
  <Rewind />
  <span
    aria-hidden="true"
    class="fs-7 fw-light font-monospace"
    style="margin-inline-start: 0.1rem; vertical-align: 0.1rem;">30</span
  >
</button>
