export const post = async ({request}) => get(request);

export const get = async () => {
  return {
    body: {
      'subsonic-response': {
        status: 'ok',
        version: '1.16.0',
        podcasts: {
          channel: []
        }
      }
    }
  };
};
