
import { newLogger } from '@dbux/common/src/log/logger';
import progressLogHandler from './progressLog';

const logger = newLogger('Project-DataLib');
const { log, debug, warn, error: logError } = logger;

const keyName = 'progressLog';
let storage;

function resetToDefault() {
  storage.set(keyName, progressLogHandler.newProgressLog());
}

function saveProgressLog(progressLog) {
  storage.set(keyName, progressLog);
}

export default function getOrCreateProgressLog(_storage) {
  storage = _storage;
  if (!storage.get(keyName)) {
    resetToDefault();
  }

  // resetToDefault();

  let progressLog = storage.get(keyName);

  // debug(`Current storage`, progressLog);
  return progressLog;
}

export { saveProgressLog };