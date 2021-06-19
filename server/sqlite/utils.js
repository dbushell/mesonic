// SQL
import {sprintf} from 'printf';

// CSV parsing options
export const parseOptions = {
  skipFirstRow: true,
  parse: (item) => {
    for (const [key, value] of Object.entries(item)) {
      if (/_at$/.test(key)) {
        // Convert dates
        item[key] = new Date(value);
      } else if (!['path', 'name'].includes(key)) {
        // Convert integers
        item[key] = isNaN(value) ? value : Number.parseInt(value, 10);
      }
    }
    return item;
  }
};

// Format and escape SQL query
// TODO: test injection bugs
export const sqlf = (str, ...args) => {
  args = args.map((val) => {
    switch (typeof val) {
      case 'function':
        return val();
      case 'object':
        return Object.values(val)[0].replace(/[^a-z_]/g, '');
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
