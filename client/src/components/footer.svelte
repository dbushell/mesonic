<script>
  import GitHub from '../icons/github.svelte';

  const year = new Date().getFullYear();
</script>

<footer
  class="container-fluid text-center fs-7 pb-5 mt-auto"
  aria-label="information"
>
  <p class="text-dark text-center text-nowrap d-inline-flex m-0">
    <span>v0.22.0 &nbsp;|&nbsp; © {year}</span>
    <a
      rel="noreferrer"
      href="https://dbushell.com/"
      class="text-dark mx-2"
      target="_blank"
    >
      David Bushell
    </a>
    <a
      rel="noreferrer"
      href="https://github.com/dbushell/mesonic"
      class="text-dark"
      target="_blank"
    >
      <GitHub />
      <span class="visually-hidden">GitHub</span>
    </a>
  </p>
</footer>
