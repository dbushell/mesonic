import {fetchEpisodes} from '../../stores.js';

export const load = async ({fetch, params, parent}) => {
  await parent();
  const props = {fetch, id: params.id};
  return {
    episodes: await fetchEpisodes(props)
  };
};
