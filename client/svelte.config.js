import nodeAdapter from '@sveltejs/adapter-node';
import staticAdapter from '@sveltejs/adapter-static';

// Default to static build
let adapter = staticAdapter;

// Use node server if inside Docker container
if ('MESONIC_CONFIG' in process.env) {
  adapter = nodeAdapter;
}

const config = {
  kit: {
    vite: () => ({
      server: {
        hmr: {
          host: 'localhost',
          port: 12080
        }
      }
    }),
    adapter: adapter()
  }
};

export default config;
