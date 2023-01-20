import {fetchPodcasts} from '../../stores.js';

export const load = async ({fetch, parent}) => {
  await parent();
  const props = {fetch};
  return {
    podcasts: await fetchPodcasts(props)
  };
};
