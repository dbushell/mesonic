export const post = async (request) => get(request);

export const get = async () => {
  return {
    body: {
      'subsonic-response': {
        status: 'ok',
        version: '1.16.0',
        artist: {
          id: 1,
          name: 'Herman Melville',
          title: 'Herman Melville',
          albumCount: 1,
          album: [
            {
              isDir: true,
              id: 1,
              name: 'Moby Dick, or the Whale',
              title: 'Moby Dick, or the Whale',
              artistId: 1,
              artist: 'Herman Melville',
              created: '2021-05-01T10:00:00.000Z',
              songCount: 44,
              duration: 88670
            }
          ]
        }
      }
    }
  };
};
