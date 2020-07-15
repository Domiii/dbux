
import { newLogger } from 'dbux-common/src/log/logger';
import bugResultHandler from './BugResult';
import testRunHandler from './TestRun';

const logger = newLogger('BugsInformation');
const { log, debug, warn, error: logError } = logger;

function newBugsInformation() {
  return {
    testRuns: [],
    bugResults: [],
  };
}

function processBugResult(obj, bug, result) {
  debug(`processBugResult obj bug result`, obj, bug, result);
  obj.testRuns.push(testRunHandler.newTestRun(bug, result));
  let bugResult = getOrCreateBugResult(obj.bugResults, bug);
  bugResultHandler.updateStatus(bugResult, result);
  debug(`new buginformation`, obj);
  obj.save();
}

function getOrCreateBugResult(bugResults, bug) {
  let result = bugResults.filter((bugResult) => {
    return bugResultHandler.isMatch(bugResult, bug.project.name, bug.id);
  })?.[0];

  if (!result) {
    result = bugResultHandler.newBugResult(bug);
    bugResults.push(result);
  }

  return result;
}

export default {
  newBugsInformation,
  processBugResult,
  getOrCreateBugResult,
};