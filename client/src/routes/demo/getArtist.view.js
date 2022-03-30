export const post = async (ev) => get(ev);

export const get = async () => {
  return {
    body: {
      'subsonic-response': {
        status: 'ok',
        version: '1.16.0',
        artist: {
          id: 'artist-1',
          name: 'Herman Melville',
          title: 'Herman Melville',
          albumCount: 1,
          album: [
            {
              isDir: true,
              id: 'album-1',
              name: 'Moby Dick, or the Whale',
              title: 'Moby Dick, or the Whale',
              artistId: 'artist-1',
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
