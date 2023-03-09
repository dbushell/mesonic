// RSS
import * as log from 'log';
import * as path from 'path';
import * as hex from 'hex';
import * as html from './html.js';
import {PODCASTS, PODCASTS_IMAGE_AGE} from '../constants.js';

const r_time = /(?:(\d+):)?(\d+):(\d+)/;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

// Convert string to milliseconds
export const parseTime = (str) => {
  let ms = 0;
  if (!str) {
    return ms;
  } else if (!isNaN(str)) {
    ms = Number.parseInt(str, 10);
  } else if (r_time.test(str)) {
    const match = str.match(r_time).slice(1);
    match.forEach((v, i) => {
      ms += Number.parseInt(v ?? 0, 10) * Math.pow(60, match.length - ++i);
    });
  } else {
    log.error(`Unknown podcast duration: "${str}"`);
  }
  return isNaN(ms) ? 0 : ms * 1000;
};

// Validate RSS feed
const r_rss = /<rss[^>]*?>.*?<\/rss>/s;

// Capture XML element
const r_tag = (tag) => new RegExp(`<${tag}[^>]*?>(.*?)<\/${tag}>`, 's');

// Capture XML character data
const r_cdata = /<!\[CDATA\[(.*?)]]>/s;

// Capture all episodes
const r_items = /<item>(.*?)<\/item>/gs;

// Capture cover image URL
const r_image = /<itunes:image[^>]*?href="([^"]*?)"[^>]*?>/;

// Capture episode URL
const r_url = /<enclosure[^>]*?url="([^"]*?)"[^>]*?>/;

// Capture episode length
const r_length = /<enclosure[^>]*?length="([^"]*?)"[^>]*?>/;

// Trim CDATA wrapping tags
const getText = (xml) =>
  (r_cdata.test(xml) ? (xml.match(r_cdata) ?? [, ''])[1] : xml).trim();

// Return single element text value
export const getValue = (tag, xml, fallback = '') =>
  getText((xml.match(r_tag(tag)) ?? [, fallback])[1]);

// Return title with HTML entities decoded
export const getTitle = (xml) => html.decode(getValue('title', xml));

// Return item data from RSS feed
export const getEpisodes = async (feed_url, xml) => {
  let items = Array.from(xml.matchAll(r_items), (match) => match[0]);
  items = await Promise.all(
    items.map(async (item) => {
      const url = (item.match(r_url) ?? [, ''])[1].trim();
      if (url.length === 0) {
        return false;
      }
      const name = getTitle(item);
      const modified_at = new Date(getValue('pubDate', item));
      const duration = parseTime(getValue('itunes:duration', item));
      let size = item.match(r_length);
      size = size && !isNaN(size[1]) ? Number.parseInt(size[1], 10) : 0;
      let path = textEncoder.encode(feed_url + getValue('guid', item));
      path = await crypto.subtle.digest('sha-256', path);
      // path = hex.encodeToString(new Uint8Array(path));
      path = textDecoder.decode(hex.encode(new Uint8Array(path)));

      return {
        modified_at,
        url,
        name,
        path,
        duration,
        size
      };
    })
  );
  return items.filter(Boolean);
};

// Return podcast feed
export const fetchFeed = async (url) => {
  try {
    const response = await fetch(url);
    const xml = await response.text();
    if (r_rss.test(xml)) {
      return xml;
    } else {
      log.warning(`Invalid RSS feed: "${url}"`);
    }
  } catch (err) {
    log.warning(`Failed to fetch: "${url}"`);
    log.error(err.messge ?? err);
  }
  return false;
};

// Fetch and save podcast image
export const fetchImage = async (feed_url, xml) => {
  try {
    let local = textEncoder.encode(feed_url.toString());
    local = await crypto.subtle.digest('sha-256', local);
    // local = hex.encodeToString(new Uint8Array(local));
    local = textDecoder.decode(hex.encode(new Uint8Array(local)));

    let remote = xml.match(r_image);
    if (!remote) {
      return;
    }
    local = path.join(PODCASTS, local + '.webp');
    let stat;
    try {
      stat = await Deno.lstat(local);
      if (Date.now() - stat.mtime.getTime() < PODCASTS_IMAGE_AGE) {
        return;
      }
    } catch (err) {}
    const response = await fetch(new URL(remote[1]));
    const buffer = new Uint8Array(await response.arrayBuffer());
    await Deno.writeFile(`${local}.tmp`, buffer);
    const process = Deno.run({
      cmd: [
        'ffmpeg',
        '-v',
        'error',
        '-y',
        '-i',
        `${local}.tmp`,
        '-vf',
        'scale=320:320',
        local
      ]
    });
    const status = await process.status();
    process.close();
    if (!status.success) {
      log.error(`Failed to resize image: ${local}`);
    }
    await Deno.remove(`${local}.tmp`);
  } catch (err) {
    log.warning(err);
  }
};
