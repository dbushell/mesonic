<script>
  import {createEventDispatcher} from 'svelte';
  import Forward from '../icons/forward.svelte';

  const dispatch = createEventDispatcher();

  export let isDisabled;
</script>

<button
  disabled={isDisabled}
  on:click={() => dispatch('click')}
  type="button"
  aria-label="fast-foward 30 seconds"
  class="btn btn-outline-primary text-nowrap"
>
  <span
    aria-hidden="true"
    class="fs-7 fw-light font-monospace"
    style="margin-inline-end: 0.1rem; vertical-align: 0.1rem;">30</span
  >
  <Forward />
</button>
