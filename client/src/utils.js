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

const relativeFormat = new Intl.RelativeTimeFormat('en-GB', {numeric: 'auto'});
const shortFormat = new Intl.DateTimeFormat('en-GB', {weekday: 'long'});
const longFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric'
});

// Limit relative format to one week
export const formatDate = (date) => {
  let str;
  const days = Math.ceil((date - new Date()) / 86400000);
  if (days > -6) {
    if (days > -2) {
      str = relativeFormat.format(days, 'day');
    } else {
      str = shortFormat.format(date);
    }
    str = str.charAt(0).toUpperCase() + str.slice(1);
  } else {
    str = longFormat.format(date);
  }
  return str;
};
