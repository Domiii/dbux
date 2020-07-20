
import { newLogger } from 'dbux-common/src/log/logger';
import { saveProgressLog } from '.';
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

async function processBugResult(progressLog, bug, result) {
  progressLog.testRuns.push(await testRunHandler.newTestRun(bug, result));

  let bugResult = getOrCreateBugResult(progressLog.bugResults, bug);
  bugResultHandler.updateStatus(bugResult, result);

  saveProgressLog(progressLog);
}

function processUnfinishTestRun(progressLog, bug, patchString) {
  progressLog.testRuns.push(testRunHandler.newTestRunWithPatchString(bug, patchString));

  saveProgressLog(progressLog);
}

function getBugResultByBug(progressLog, bug) {
  return getBugResult(progressLog.bugResults, bug);
}

function getTestRunsByBug(progressLog, _bug) {
  debug(`gettestrunsbybug`, progressLog, _bug);
  return progressLog.testRuns.filter((bug) => {
    return testRunHandler.isTestRunOfBug(bug, _bug);
  });
}

// ########################################
//  private
// ########################################

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

export default {
  newProgressLog,
  processBugResult,
  processUnfinishTestRun,
  getBugResultByBug,
  getTestRunsByBug,
};
