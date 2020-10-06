
import os from 'os';
import path from 'path';
import lockfile from 'lockfile';
import { newLogger } from '@dbux/common/src/log/logger';

const { log, debug, warn, error: logError } = newLogger('SavetyStorage');

let storageGet, storageSet;

function getLockfileName(name) {
  let lockfilePath = path.join(os.tmpdir(), `dbux-lockfile.${name}`);
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
    return storageGet(this.name);
  }

  async set(value) {
    await storageSet(this.name, value);
  }
}

export function initSafetyStorage(storageFunctions) {
  ({ get: storageGet, set: storageSet } = storageFunctions);
}