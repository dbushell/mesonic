// Mod
import * as log from 'log';
import * as path from 'path';
import * as api from './api.js';
import * as tasks from './tasks.js';
import {getRequestData} from './utils.js';

await tasks.checkEnv();

log.info('meSonic v0.12.7');

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
  await tasks.syncMedia();
}

// Return response body JSON (or `Response`) for REST API requests
const getResponse = async (url, request) => {
  if (url.pathname === '/rest/test.view') {
    const data = {};
    for (const pair of await getRequestData(request)) {
      data[pair[0]] = pair[1];
    }
    return {data};
  }
  if (url.pathname === '/rest/ping.view') {
    return {};
  }
  if (url.pathname === '/rest/getLicense.view') {
    return {license: {valid: true}};
  }
  if (url.pathname === '/rest/startScan.view') {
    return await api.startScan();
  }
  if (url.pathname === '/rest/getScanStatus.view') {
    return await api.getScanStatus();
  }
  if (url.pathname === '/rest/getGenres.view') {
    return await api.getGenres();
  }
  if (url.pathname === '/rest/getPlaylists.view') {
    return await api.getPlaylists();
  }
  if (url.pathname === '/rest/getPodcasts.view') {
    return await api.getPodcasts();
  }
  if (url.pathname === '/rest/getUser.view') {
    return await api.getUser();
  }
  if (url.pathname === '/rest/getMusicFolders.view') {
    return await api.getMusicFolders();
  }
  if (url.pathname === '/rest/getMusicDirectory.view') {
    return await api.getMusicDirectory();
  }
  if (url.pathname === '/rest/getIndexes.view') {
    return await api.getIndexes();
  }
  if (url.pathname === '/rest/getArtistInfo.view') {
    return await api.getArtistInfo();
  }
  if (url.pathname === '/rest/getArtistInfo2.view') {
    return await api.getArtistInfo2();
  }
  if (url.pathname === '/rest/getAlbumList.view') {
    return await api.getAlbumList();
  }
  if (url.pathname === '/rest/getAlbumList2.view') {
    return await api.getAlbumList2();
  }
  if (url.pathname === '/rest/getBookmarks.view') {
    return await api.getBookmarks();
  }
  if (url.pathname === '/rest/createBookmark.view') {
    try {
      const form = await getRequestData(request);
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
  if (url.pathname === '/rest/deleteBookmark.view') {
    try {
      const form = await getRequestData(request);
      await api.deleteBookmark(form.get('id'));
      return {};
    } catch (err) {
      log.error(err);
    }
  }
  if (url.pathname === '/rest/getArtists.view') {
    return await api.getArtists();
  }
  if (url.pathname === '/rest/getArtist.view') {
    try {
      const form = await getRequestData(request);
      return await api.getArtist(form.get('id'));
    } catch (err) {
      log.warning(err);
      return {
        status: 'failed',
        error: {code: 70, message: 'Artist not found'}
      };
    }
  }
  if (url.pathname === '/rest/getAlbum.view') {
    try {
      const form = await getRequestData(request);
      return await api.getAlbum(form.get('id'));
    } catch (err) {
      log.warning(err);
      return {
        status: 'failed',
        error: {code: 70, message: 'Album not found'}
      };
    }
  }
  if (url.pathname === '/rest/getSong.view') {
    try {
      const form = await getRequestData(request);
      return await api.getSong(form.get('id'));
    } catch (err) {
      log.warning(err);
      return {
        status: 'failed',
        error: {code: 70, message: 'Song not found'}
      };
    }
  }
  if (url.pathname === '/rest/stream.view') {
    try {
      const form = await getRequestData(request);
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
  return {
    status: 'failed',
    error: {code: 0, message: 'API request not supported'}
  };
};

const onConn = async (conn) => {
  const httpConn = Deno.serveHttp(conn);
  for await (const requestEvent of httpConn) {
    const {request, respondWith} = requestEvent;
    const url = new URL(request.url);
    let {method} = request;
    if (
      method === 'POST' &&
      request.headers.get('content-type') === 'application/json'
    ) {
      method = 'JSON';
    }
    log.debug(`${method} ${url}`);
    let body;
    if (['POST', 'GET'].includes(request.method)) {
      body = await getResponse(url, request);
    }
    if (body instanceof Response) {
      respondWith(body);
      continue;
    }
    // Wrap body is Subsonic response
    body = {
      'subsonic-response': {
        status: 'ok',
        version: '1.16.0',
        ...body
      }
    };
    respondWith(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: {
          'access-control-allow-headers':
            'accept, accept-encoding, content-type, content-length, range',
          'access-control-allow-methods': 'POST, GET, HEAD, OPTIONS',
          'access-control-allow-origin': '*',
          'content-type': 'application/json'
        }
      })
    );
  }
};

const server = Deno.listen({port: 8080});

log.info(`🚀 Launched: http://localhost:8080`);

for await (const conn of server) {
  try {
    onConn(conn);
  } catch (err) {
    log.critical(err);
  }
}
