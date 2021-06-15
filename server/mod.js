// Module
import * as log from 'log';
import * as path from 'path';
import * as api from './api.js';
import * as tasks from './tasks.js';
import {HEADERS} from './constants.js';

await tasks.checkEnv();

log.info('meSonic v0.16.4');

// Return the version
if (Deno.args.includes('--version')) {
  Deno.exit();
}

// Create the SQLite database if necessary
await tasks.createDatabase();

// Run basic cleanup or a full sync by default
if (Deno.args.includes('--no-sync')) {
  await tasks.tidyDatabase();
} else {
  await tasks.syncData();
}

// Return get/set compatible object from request methods
const getRequestData = async (request) => {
  try {
    if (request.method === 'GET') {
      return new Map(new URL(request.url).searchParams.entries());
    }
    if (request.headers.get('content-type') === 'application/json') {
      return new Map(Object.entries(await request.json()));
    }
    if (request.method === 'POST') {
      return new Map((await request.formData()).entries());
    }
  } catch (err) {
    log.error(err);
  }
  return new Map();
};

// Return response body JSON (or `Response`) for REST API requests
const getResponse = async (request) => {
  if (!['POST', 'GET'].includes(request.method)) {
    return;
  }
  const {pathname} = new URL(request.url);
  const form = await getRequestData(request);
  if (pathname === '/rest/test.view') {
    const data = {};
    for (const pair of form) {
      data[pair[0]] = pair[1];
    }
    return {data};
  }
  if (pathname === '/rest/ping.view') {
    return {};
  }
  if (pathname === '/rest/getLicense.view') {
    return {license: {valid: true}};
  }
  if (pathname === '/rest/startScan.view') {
    return await api.startScan();
  }
  if (pathname === '/rest/getScanStatus.view') {
    return await api.getScanStatus();
  }
  if (pathname === '/rest/getGenres.view') {
    return await api.getGenres();
  }
  if (pathname === '/rest/getPlaylists.view') {
    return await api.getPlaylists();
  }
  if (pathname === '/rest/getUser.view') {
    return await api.getUser();
  }
  if (pathname === '/rest/getMusicFolders.view') {
    return await api.getMusicFolders();
  }
  if (pathname === '/rest/getArtistInfo.view') {
    return await api.getArtistInfo();
  }
  if (pathname === '/rest/getArtistInfo2.view') {
    return await api.getArtistInfo2();
  }
  if (pathname === '/rest/getAlbumList.view') {
    return await api.getAlbumList();
  }
  if (pathname === '/rest/getAlbumList2.view') {
    return await api.getAlbumList2();
  }
  if (pathname === '/rest/getIndexes.view') {
    return await api.getIndexes();
  }
  if (pathname === '/rest/getMusicDirectory.view') {
    try {
      return await api.getMusicDirectory(form.get('id'));
    } catch (err) {
      log.warning(err);
      return {
        status: 'failed',
        error: {code: 70, message: 'Directory not found'}
      };
    }
  }
  if (pathname === '/rest/getBookmarks.view') {
    return await api.getBookmarks();
  }
  if (pathname === '/rest/createBookmark.view') {
    try {
      await api.createBookmark(
        form.get('id'),
        form.get('position'),
        form.get('comment')
      );
      return {};
    } catch (err) {
      log.warning(err);
    }
  }
  if (pathname === '/rest/deleteBookmark.view') {
    try {
      await api.deleteBookmark(form.get('id'));
      return {};
    } catch (err) {
      log.error(err);
    }
  }
  if (pathname === '/rest/getPodcasts.view') {
    try {
      return await api.getPodcasts(form.get('id'), form.get('includeMeta'));
    } catch (err) {
      log.warning(err);
      return {
        status: 'failed',
        error: {code: 70, message: 'Podcast(s) not found'}
      };
    }
  }
  if (pathname === '/rest/createPodcastChannel.view') {
    try {
      return await api.createPodcastChannel(form.get('url'));
    } catch (err) {
      log.warning(err);
      return {
        status: 'failed',
        error: {code: 70, message: 'Podcast URL not found'}
      };
    }
  }
  if (pathname === '/rest/deletePodcastChannel.view') {
    try {
      return await api.deletePodcastChannel(form.get('id'));
    } catch (err) {
      log.warning(err);
      return {
        status: 'failed',
        error: {code: 70, message: 'Podcast not found'}
      };
    }
  }
  if (pathname === '/rest/getArtists.view') {
    return await api.getArtists();
  }
  if (pathname === '/rest/getArtist.view') {
    try {
      return await api.getArtist(form.get('id'));
    } catch (err) {
      log.warning(err);
      return {
        status: 'failed',
        error: {code: 70, message: 'Artist not found'}
      };
    }
  }
  if (pathname === '/rest/getAlbum.view') {
    try {
      return await api.getAlbum(form.get('id'));
    } catch (err) {
      log.warning(err);
      return {
        status: 'failed',
        error: {code: 70, message: 'Album not found'}
      };
    }
  }
  if (pathname === '/rest/getSong.view') {
    try {
      return await api.getSong(form.get('id'));
    } catch (err) {
      log.warning(err);
      return {
        status: 'failed',
        error: {code: 70, message: 'Song not found'}
      };
    }
  }
  // Redirect stream to be handled by Caddy server
  if (pathname === '/rest/stream.view') {
    try {
      const {song} = await api.getSong(form.get('id'), true);
      return new Response('', {
        status: 307,
        headers: {
          location: path.join(song.path.dir, song.path.base)
        }
      });
    } catch (err) {
      log.warning(err);
      return {
        status: 'failed',
        error: {code: 70, message: 'Song not found'}
      };
    }
  }
  // Default unknown request error
  return {
    status: 'failed',
    error: {code: 0, message: 'API request not supported'}
  };
};

// Handle HTTP server connections
const onConn = async (conn) => {
  const httpConn = Deno.serveHttp(conn);
  for await (const {request, respondWith} of httpConn) {
    const type = request.headers.get('content-type')?.match(/[\w]+\/([\w-]+)/);
    log.debug(`${request.method}${type ? ` [${type[1]}]` : ''} ${request.url}`);
    // Get JSON response or immediately return
    const body = await getResponse(request);
    if (body instanceof Response) {
      respondWith(body);
      continue;
    }
    // Wrap body is Subsonic response
    respondWith(
      new Response(
        JSON.stringify({
          'subsonic-response': {
            status: 'ok',
            version: '1.16.0',
            ...body
          }
        }),
        {
          status: 200,
          headers: HEADERS
        }
      )
    ).catch(log.error);
  }
};

const server = Deno.listen({port: 8080});

log.info(`🚀 Launched`);
log.info(`Server: http://localhost:8080`);
log.info(`Client: http://localhost:3000`);
log.info(`Proxy:  http://localhost:4040`);

for await (const conn of server) {
  onConn(conn).catch(log.error);
}
