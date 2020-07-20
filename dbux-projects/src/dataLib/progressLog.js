
import { newLogger } from 'dbux-common/src/log/logger';
import bugResultHandler from './BugResult';
import testRunHandler from './TestRun';

const logger = newLogger('ProgressLog');
const { log, debug, warn, error: logError } = logger;

function newProgressLog() {
  return {
    testRuns: [],
    bugResults: [],
  };
}

async function processBugResult(processLog, bug, result) {
  debug(`process bug result`, processLog, bug, result);
  processLog.testRuns.push(await testRunHandler.newTestRun(bug, result));

  let bugResult = getOrCreateBugResult(processLog.bugResults, bug);
  bugResultHandler.updateStatus(bugResult, result);

  processLog.save();
}

function getBugResult(bugResults, bug) {
  return bugResults.filter((bugResult) => {
    return bugResultHandler.isMatch(bugResult, bug.project.name, bug.id);
  })?.[0];
}

function getOrCreateBugResult(bugResults, bug) {
  let result = getBugResult(bugResults, bug);

  if (!result) {
    result = bugResultHandler.newBugResult(bug);
    bugResults.push(result);
  }

  return result;
}

function getBugResultByBug(processLog, bug) {
  debug(processLog, bug);
  return getBugResult(processLog.bugResults, bug);
}

export default {
  newProgressLog,
  processBugResult,
  getBugResultByBug,
};