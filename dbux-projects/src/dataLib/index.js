
import { newLogger } from 'dbux-common/src/log/logger';
import bugsInformationHandler from './BugsInformation';

const logger = newLogger('Project-DataLib');
const { log, debug, warn, error: logError } = logger;

const keyName = 'bugsInformation';
let storage;

/**
 * @param {Memento} storage - the permanent storage variable
 */
function resetToDefault() {
  debug(`Reset storage to default`);
  storage.set(keyName, bugsInformationHandler.newBugsInformation());
}

export default function getOrCreateBugsInformation(_storage) {
  storage = _storage;
  if (!storage.get(keyName)) {
    storage.set(keyName, bugsInformationHandler.newBugsInformation());
  }

  // resetToDefault(storage);

  let obj = storage.get(keyName);
  obj.save = function () {
    storage.set(keyName, this);
  };

  // debug(`Current storage`, obj);
  return obj;
}