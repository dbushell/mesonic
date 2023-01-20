import {fetchArtists} from '../stores.js';

export const load = async ({fetch, parent}) => {
  await parent();
  const props = {fetch};
  return {
    artists: await fetchArtists(props)
  };
};
