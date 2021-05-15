import adapter from '@sveltejs/adapter-static';

const config = {
  kit: {
    vite: {
      server: {
        hmr: {
          host: 'localhost',
          port: 12080
        }
      }
    },
    target: '#svelte',
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: null
    })
  }
};

export default config;
