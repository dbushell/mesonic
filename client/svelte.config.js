import nodeAdapter from '@sveltejs/adapter-node';
import staticAdapter from '@sveltejs/adapter-static';

const isServer = 'MESONIC_CONFIG' in process.env;

// Default to static build
let adapter = staticAdapter;

// Use node server if inside Docker container
if (isServer) {
  adapter = nodeAdapter;
}

// // TODO: fix prerender
// const config = {
//   kit: {
//     prerender: {
//       default: !isServer
//     },
//     adapter: adapter()
//   }
// };

const config = {
  kit: {
    adapter: adapter()
  }
};

export default config;
