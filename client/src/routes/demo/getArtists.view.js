export const post = async ({request}) => get(request);

export const get = async () => {
  return {
    body: {
      'subsonic-response': {
        status: 'ok',
        version: '1.16.0',
        artists: {
          ignoredArticles: '',
          index: [
            {
              name: 'M',
              artist: [
                {
                  id: 'artist-1',
                  name: 'Herman Melville',
                  title: 'Herman Melville',
                  albumCount: 1
                }
              ]
            }
          ]
        }
      }
    }
  };
};
