export const post = async (ev) => get(ev);

export const get = async () => {
  return {
    'subsonic-response': {
      status: 'ok',
      version: '1.16.0',
      scanStatus: {count: 44, scanning: false}
    }
  };
};
