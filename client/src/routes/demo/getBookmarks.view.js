export const post = async (ev) => get(ev);

export const get = async () => {
  return {
    body: {
      'subsonic-response': {
        status: 'ok',
        version: '1.16.0',
        bookmarks: {
          bookmark: []
        }
      }
    }
  };
};
