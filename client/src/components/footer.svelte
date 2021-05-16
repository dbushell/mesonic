<script>
  import GitHub from '../icons/github.svelte';

  const year = new Date().getFullYear();
</script>

<footer class="container-fluid pb-5 mt-auto" aria-label="meSonic information">
  <p class="fs-7 text-dark text-center m-0">
    v0.13.2 &nbsp;|&nbsp; © {year}
    <a href="https://dbushell.com/" class="text-dark" target="_blank">
      David Bushell
    </a>
    <a
      href="https://github.com/dbushell/mesonic"
      class="text-dark ms-2"
      target="_blank"
    >
      <GitHub />
      <span class="visually-hidden">GitHub</span>
    </a>
  </p>
</footer>
