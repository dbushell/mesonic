import {get} from 'svelte/store';
import {offlineStore, serverStore} from './stores.js';

/*
// https://bugs.webkit.org/show_bug.cgi?id=226547#c28
async function workaroundSafariBug() {
  const isSafari =
    /Safari\//.test(navigator.userAgent) &&
    !/Chrom(e|ium)\//.test(navigator.userAgent);
  if (!isSafari) return;
  let intervalId;
  await new Promise((resolve, reject) => {
    const tryIdb = () => indexedDB.databases().then(resolve, reject);
    intervalId = setInterval(tryIdb, 100);
    tryIdb();
  });
  clearInterval(intervalId);
}
*/

export const loadIndexedDB = async () => {
  // await workaroundSafariBug();
  const open = globalThis.indexedDB.open('mesonic', 1);
  open.addEventListener('upgradeneeded', (ev) => {
    ev.target.result.createObjectStore('downloads');
  });
  open.addEventListener('success', (ev) => {
    offlineStore.set({...get(offlineStore), db: ev.target.result});
    updateDownloads();
  });
  open.addEventListener('error', (ev) => {
    console.log(ev);
  });
};

const updateDownloads = async () =>
  new Promise(async (resolve) => {
    try {
      const {db} = get(offlineStore);
      const transaction = db.transaction(['downloads'], 'readwrite');
      const downloads = transaction.objectStore('downloads');
      const request = downloads.getAllKeys();
      request.addEventListener('success', () => {
        offlineStore.set({...get(offlineStore), cached: [...request.result]});
        resolve();
      });
      request.addEventListener('error', () => {
        console.log(request.error);
        resolve();
      });
    } catch (err) {
      console.log(err);
      resolve();
    }
  });

export const deleteOffline = async ({id}) =>
  new Promise(async (resolve) => {
    try {
      const {db} = get(offlineStore);
      const transaction = db.transaction(['downloads'], 'readwrite');
      const request = transaction.objectStore('downloads').delete(id);
      request.addEventListener('success', async () => {
        await updateDownloads();
        resolve();
      });
      request.addEventListener('error', () => {
        console.log(request.error);
        resolve();
      });
    } catch (err) {
      console.log(err);
      resolve();
    }
  });

export const addOffline = async ({id, url}) =>
  new Promise(async (resolve) => {
    let update;
    try {
      const offline = get(offlineStore);
      if (Object.keys(offline.downloads).includes(id)) {
        resolve();
        return;
      }
      const server = get(serverStore);
      if (url.host !== server.host) {
        url = new URL(`/rest/proxy/${url}`, server);
      }
      const controller = new AbortController();
      const response = await fetch(url, {signal: controller.signal});
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      const reader = response.body.getReader();
      const type = response.headers.get('content-type');
      const length = Number.parseInt(response.headers.get('content-length'));
      let received = 0;
      let chunks = [];
      update = (done = false) => {
        const offline = get(offlineStore);
        if (done) {
          delete offline.downloads[id];
        } else {
          offline.downloads[id] = {
            controller,
            length,
            received,
            progress: (100 / length) * received
          };
        }
        offlineStore.set(offline);
      };
      update();
      while (true) {
        const {done, value} = await reader.read();
        if (done) {
          break;
        }
        received += value.length;
        chunks.push(value);
        update();
      }
      // const blob = await response.blob();
      const blob = new Blob(chunks, {type});
      const {db} = get(offlineStore);
      const transaction = db.transaction(['downloads'], 'readwrite');
      const request = transaction.objectStore('downloads').put(blob, id);
      request.addEventListener('success', async () => {
        update(true);
        await updateDownloads();
        resolve();
      });
      request.addEventListener('error', () => {
        update(true);
        console.log(request.error);
        resolve();
      });
    } catch (err) {
      update(true);
      console.log(err);
      resolve();
    }
  });

export const getOffline = async ({id}) =>
  new Promise(async (resolve) => {
    try {
      const {db} = get(offlineStore);
      const transaction = db.transaction(['downloads']);
      const request = transaction.objectStore('downloads').get(id);
      request.addEventListener('success', () => {
        resolve(request.result);
      });
      request.addEventListener('error', () => {
        console.log(request.error);
        resolve();
      });
    } catch (err) {
      console.log(err);
      resolve();
    }
  });
