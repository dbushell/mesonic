import nodeAdapter from '@sveltejs/adapter-node';
import staticAdapter from '@sveltejs/adapter-static';

const isServer = 'MESONIC_CONFIG' in process.env;

// Default to static build
let adapter = staticAdapter;

// Use node server if inside Docker container
if (isServer) {
  adapter = nodeAdapter;
}

const config = {
  kit: {
    prerender: {
      default: !isServer
    },
    vite: () => ({
      server: {
        fs: {
          allow: ['static']
        },
        hmr: {
          host: 'localhost',
          port: 3000,
          clientPort: 4040
        }
      }
    }),
    adapter: adapter()
  }
};

export default config;
