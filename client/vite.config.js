import {defineConfig} from 'vite';
import {sveltekit} from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    port: 3000,
    fs: {
      allow: ['static']
    },
    hmr: {
      host: 'localhost',
      port: 3000,
      clientPort: 4040
    }
  }
});
