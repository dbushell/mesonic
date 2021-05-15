import {get} from 'svelte/store';
import {
  addServerParams,
  fetchProps,
  serverStore,
  scanStore,
  bookmarkInvalidateStore
} from './stores.js';

// Create a song bookmark and refresh the bookmark store
export const createBookmark = async ({id, position}) => {
  try {
    const $serverStore = get(serverStore);
    const url = new URL('/rest/createBookmark.view', $serverStore);
    const props = await fetchProps(url, {
      id,
      position,
      comment: navigator.userAgent
    });
    const response = await fetch(url, props);
    const json = await response.json();
    if (json['subsonic-response']?.status !== 'ok') {
      throw new Error(json);
    }
    bookmarkInvalidateStore.set(Date.now());
  } catch (err) {
    console.log(err);
  }
};

// Delete a song bookmark and refresh the bookmark store
export const deleteBookmark = async ({id}) => {
  try {
    const $serverStore = get(serverStore);
    const url = new URL('/rest/deleteBookmark.view', $serverStore);
    const props = await fetchProps(url, {id});
    const response = await fetch(url, props);
    const json = await response.json();
    if (json['subsonic-response']?.status !== 'ok') {
      throw new Error(json);
    }
    bookmarkInvalidateStore.set(Date.now());
  } catch (err) {
    console.log(err);
  }
};

// Start a new media scan or return the current status
export const getScanStatus = async (isStart = true) => {
  const $scanStore = get(scanStore);
  if (isStart && $scanStore.scanning) {
    return;
  }
  try {
    const $serverStore = get(serverStore);
    scanStore.set({...$scanStore, scanning: true});
    const url = new URL(
      `/rest/${isStart ? 'startScan' : 'getScanStatus'}.view`,
      $serverStore
    );
    await addServerParams(url);
    const response = await fetch(url);
    const json = await response.json();
    const {status, scanStatus} = json['subsonic-response'];
    if (status !== 'ok') {
      throw new Error(json);
    }
    scanStore.set({...scanStatus});
    if (scanStatus.scanning === true) {
      setTimeout(() => getScanStatus(false), 1000);
    }
  } catch (err) {
    console.log(err);
    scanStore.set({...$scanStore, scanning: false});
  }
};
