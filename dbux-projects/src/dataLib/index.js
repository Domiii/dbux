
import { newLogger } from 'dbux-common/src/log/logger';
import progressLogHandler from './progressLog';

const logger = newLogger('Project-DataLib');
const { log, debug, warn, error: logError } = logger;

const keyName = 'progressLog';
let storage;

/**
 * @param {Memento} storage - the permanent storage variable
 */
function resetToDefault() {
  storage.set(keyName, progressLogHandler.newProgressLog());
}

export default function getOrCreateProgressLog(_storage) {
  storage = _storage;
  if (!storage.get(keyName)) {
    resetToDefault();
  }

  // resetToDefault();

  let obj = storage.get(keyName);
  obj.save = function () {
    storage.set(keyName, this);
  };

  // debug(`Current storage`, obj);
  return obj;
}