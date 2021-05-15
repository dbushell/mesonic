<script>
  import {createEventDispatcher} from 'svelte';
  import Pause from '../icons/pause.svelte';

  const dispatch = createEventDispatcher();

  export let isDisabled;
</script>

<button
  disabled={isDisabled}
  on:click={() => dispatch('click')}
  type="button"
  aria-label="Pause"
  class="btn btn-outline-primary"
>
  <Pause />
</button>
