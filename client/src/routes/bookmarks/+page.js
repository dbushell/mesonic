import {fetchBookmarks} from '../../stores.js';

export const load = async ({fetch, parent}) => {
  await parent();
  const props = {fetch};
  return {
    bookmarks: await fetchBookmarks(props)
  };
};
