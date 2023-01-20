import {parse as parseCookies} from 'cookie';

const {MESONIC_CONFIG, MESONIC_HOST} = process.env;

// Internal Docker proxy server for Deno API
const MESONIC_PROXY = 'http://localhost:4040';

export const load = async ({request}) => {
  // Default to either env variable or internal server
  let server = new URL(MESONIC_HOST || MESONIC_PROXY);
  // Use SvelteKit endpoints for static demo
  if (!MESONIC_CONFIG) {
    server = new URL('/demo/', server);
  }
  // Prefer session cookie
  const {headers} = request;
  if ('cookie' in headers) {
    const cookies = parseCookies(headers.cookie);
    if (cookies.server) {
      server = new URL(cookies.server);
    }
  }
  const session = {
    server: server.href,
    proxy: false
  };
  // Flag the use of internal proxy for SSR
  if (MESONIC_CONFIG && session.server.startsWith(MESONIC_HOST)) {
    session.proxy = MESONIC_PROXY;
  }
  // Start new session
  console.log(`New session`, session);
  return session;
};
