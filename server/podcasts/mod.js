// Podcasts
import * as log from 'log';
import * as rss from './rss.js';
import * as sqlite from '../sqlite/mod.js';
import {PODCASTS_MAX_AGE} from '../constants.js';

// Find existing entry or insert new episode
const findEpisode = async (item, episodes, podcast) => {
  let episode = episodes.find((episode) => episode.path === item.path);
  // Remove episodes older than one year
  if (Date.now() - item.modified_at > PODCASTS_MAX_AGE) {
    if (episode) {
      await sqlite.deleteEpisode({path: item.path});
    }
    return;
  }
  if (!episode) {
    await sqlite.insertEpisode({
      ...item,
      path: item.path,
      podcast_id: podcast.id
    });
    episode = await sqlite.getEpisodeBy('path', item.path, podcast.id);
    log.info(`🎙️ ${episode.name}`);
  }
  if (!episode) {
    throw new Error(
      `Failed to query episode ("${item.name}" by "${podcast.name}")`
    );
  }
  return episode;
};

// Sync single podcast episodes
export const syncPodcast = async (podcast) => {
  try {
    const episodes = await sqlite.getEpisodes({podcast_id: podcast.id});
    const url = new URL(podcast.url);
    log.info(`Syncing: "${url}"`);
    const xml = await rss.fetchFeed(url);
    const items = rss.getEpisodes(url, xml);
    let isUpdate = false;
    for (const item of items) {
      const episode = await findEpisode(item, episodes, podcast);
      if (!episode) {
        continue;
      }
      if (podcast.modified_at < episode.modified_at) {
        podcast.modified_at = episode.modified_at;
        isUpdate = true;
      }
    }
    if (isUpdate) {
      await sqlite.updatePodcast(podcast);
    }
    rss.fetchImage(url, xml);
  } catch (err) {
    log.error(err);
  }
};

// Sync all podcast episodes
export const syncPodcasts = async () => {
  const podcasts = await sqlite.getPodcasts();
  await Promise.all(podcasts.map(syncPodcast));
  await sqlite.deleteEpisodeOrphans();
};

// Update or insert podcast and sync episodes
export const createPodcast = async (url) => {
  url = new URL(url).href;
  const xml = await rss.fetchFeed(url);
  const name = rss.getTitle(xml);
  let podcasts = await sqlite.getPodcasts({key: 'url', value: url});
  if (podcasts.length) {
    await sqlite.updatePodcast({...podcasts[0], created_at: Date.now(), name});
  } else {
    await sqlite.insertPodcast({url, name});
    podcasts = await sqlite.getPodcasts({key: 'url', value: url});
  }
  await syncPodcast(podcasts[0]);
};
