
import os from 'os';
import path from 'path';
import lockfile from 'lockfile';

let storageGet, storageSet;

async function acquireLock(name) {
  let lockfilePath = path.join(os.tmpdir(), `dbux-lockfile.${name}`);

  return new Promise((resolve, reject) => {
    lockfile.lock(lockfilePath, { wait: 10 ** 9 }, (err) => {
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
    lockfile.unlockSync(this.name);
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