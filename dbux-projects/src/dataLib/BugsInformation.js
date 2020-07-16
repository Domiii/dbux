
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

async function processBugResult(obj, bug, result) {
  obj.testRuns.push(await testRunHandler.newTestRun(bug, result));

  let bugResult = getOrCreateBugResult(obj.bugResults, bug);
  bugResultHandler.updateStatus(bugResult, result);

  obj.save();
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

function getBugResultByBug(obj, bug) {
  return getBugResult(obj.bugResults, bug);
}

export default {
  newBugsInformation,
  processBugResult,
  getBugResultByBug,
};