import {fetchSongs} from '../../stores.js';

export const load = async ({fetch, params, parent}) => {
  await parent();
  const props = {fetch, id: params.id};
  return {
    songs: await fetchSongs(props)
  };
};
