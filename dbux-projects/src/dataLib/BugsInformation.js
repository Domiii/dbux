
import { newLogger } from 'dbux-common/src/log/logger';

const logger = newLogger('BugsInformation');
const { log, debug, warn, error: logError } = logger;

const keyName = 'bugsInformation';

const defaultBugInformation = {
  testRuns: [],
  bugStatuses: [],
};

/**
 * @param {Memento} storage - the permanent storage variable
 */
function resetToDefault(storage) {
  storage.update(keyName, defaultBugInformation);
}

export default function getOrCreateBugsInformation(storage) {
  if (!storage.get(keyName)) {
    storage.update(keyName, defaultBugInformation);
  }

  debug(`Current storage: ${JSON.stringify(storage.get(keyName))}`);
  return storage.get(keyName);
}