<script>
  import {createEventDispatcher} from 'svelte';
  import Play from '../icons/play.svelte';

  const dispatch = createEventDispatcher();

  export let isDisabled;
</script>

<button
  disabled={isDisabled}
  on:click={() => dispatch('click')}
  type="button"
  aria-label="Play"
  class="btn btn-outline-primary"
  style="min-width: 3.5rem"
>
  <Play />
</button>
