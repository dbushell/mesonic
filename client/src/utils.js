// Export from UMD module
import '../static/md5.umd.min.js';
export const {md5} = globalThis.hashwasm;

// Format seconds to `00:00:00` duration
export const formatTime = (s) => {
  s = Number.parseInt(s, 10);
  const hh = String(Math.floor(s / 3600)).padStart('2', '0');
  const mm = String(Math.floor(s / 60) % 60).padStart('2', '0');
  const ss = String(s % 60).padStart('2', '0');
  return `${hh}:${mm}:${ss}`.replace(/^00:/, '');
};
