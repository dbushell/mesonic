// Utils
import * as log from 'log';
import {sprintf} from 'printf';

// Sort alphabetical with "Track 10" after " Track 1"
const naturalCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base'
});
export const naturalSort = (item, key = 'name') =>
  item.sort((a, b) => naturalCollator.compare(a[key], b[key]));

// Return get/set compatible object from request methods
export const getRequestData = async (request) => {
  try {
    if (request.method === 'GET') {
      return new Map(new URL(request.url).searchParams.entries());
    }
    if (request.headers.get('content-type') === 'application/json') {
      return new Map(Object.entries(await request.json()));
    }
    if (request.method === 'POST') {
      return new Map((await request.formData()).entries());
    }
  } catch (err) {
    log.error(err);
  }
};

// Format and escape SQL query
// TODO: test injection bugs
export const sqlf = (str, ...args) => {
  args = args.map((val) => {
    switch (typeof val) {
      case 'boolean':
        return val ? 'true' : 'false';
      case 'number':
        return val;
    }
    val = val.replaceAll(`'`, `''`);
    return `'${val}'`;
  });
  return sprintf(str, ...args);
};

// Rate limit promises in order
export class Queue {
  #pending = [];
  #idle = true;

  #next() {
    if (this.#idle && this.#pending.length) {
      this.#pending.shift()();
    }
  }

  push(fn) {
    return new Promise((resolve, reject) => {
      this.#pending.push(async () => {
        this.#idle = false;
        try {
          const result = await Promise.resolve(fn());
          resolve(result);
        } catch (err) {
          reject(err);
        }
        this.#idle = true;
        this.#next();
      });
      this.#next();
    });
  }
}
