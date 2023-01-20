import {fetchAlbums} from '../../stores.js';

export const load = async ({fetch, params, parent}) => {
  await parent();
  const props = {fetch, id: params.id};
  return {
    albums: await fetchAlbums(props)
  };
};
