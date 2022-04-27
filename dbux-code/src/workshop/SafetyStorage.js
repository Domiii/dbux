import os from 'os';
import path from 'path';
import lockfile from 'lockfile';
import { newLogger } from '@dbux/common/src/log/logger';
import { get, set } from '../memento';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('SavetyStorage');

function getLockfileName(name) {
  const lockfilePath = path.join(os.tmpdir(), `dbux-lockfile.${name}`);
  return lockfilePath;
}

async function acquireLock(name) {
  return new Promise((resolve, reject) => {
    lockfile.lock(getLockfileName(name), { wait: 10 ** 9 }, (err) => {
      if (err) {
        reject(err);
      }
      else {
        resolve();
      }
    });
  });
}

export default class SafetyStorage {
  constructor(name) {
    this.name = name;
  }

  async acquireLock() {
    return acquireLock(this.name);
  }

  releaseLock() {
    lockfile.unlockSync(getLockfileName(this.name));
  }

  get() {
    return get(this.name);
  }

  async set(value) {
    await set(this.name, value);
  }
}
