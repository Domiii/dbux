import TestRun from './TestRun';
import BugProgress from './BugProgress';
import BugStatus from './BugStatus';

/** @typedef {import('../projectLib/Bug').default} Bug */
/** @typedef {import('./ProgressLogController').default} ProgressLogController */

export default {

  // ###########################################################################
  // processor (update BugProgress & add TestRun)
  // ###########################################################################

  /**
   * NOTE: A unfinished TestRun is saved with result.code = -1
   * @param {ProgressLogController} plc 
   * @param {Bug} bug 
   * @param {string} patchString 
   */
  async addUnfinishedTestRun(plc, bug, patchString = null) {
    await plc.util.addTestRun(bug, { code: -1 }, patchString);
  },

  /**
   * @param {ProgressLogController} plc 
   * @param {Bug} bug 
   * @param {string} patchString 
   */
  async addTestRun(plc, bug, result, patchString = null) {
    if (patchString === null) {
      patchString = await bug.project.getPatchString();
    }
    const testRun = new TestRun(bug, result, patchString);
    plc.progressLog.testRuns.push(testRun);
    return testRun;
  },

  /**
   * @param {ProgressLogController} plc 
   * @param {Bug} bug 
   * @param {Object} update
   */
  updateBugProgress(plc, bug, update) {
    const bugProgress = plc.util.getBugProgressByBug(bug);
    for (const key of Object.keys(update)) {
      bugProgress[key] = update[key];
    }
    bugProgress.updatedAt = Date.now();
  },

  /**
   * Update bug progress if result is better than before
   * @param {ProgressLogController} plc 
   * @param {Bug} bug 
   * @param {Object} result
   */
  updateBugStatusByResult(plc, bug, result) {
    const resultStatus = result.code ? BugStatus.Attempted : BugStatus.Solved;
    const bugProgress = plc.util.getBugProgressByBug(bug);

    if (bugProgress.status < resultStatus) {
      plc.util.updateBugProgress(bug, { status: resultStatus });
    }
  },

  /**
   * @param {ProgressLogController} plc 
   * @param {Bug} bug
   * @return {BugProgress}
   */
  addNewBugProgress(plc, bug, status, stopwatchEnabled) {
    const bugProgress = new BugProgress(bug, status, stopwatchEnabled);
    plc.progressLog.bugProgresses.push(bugProgress);
    return bugProgress;
  },

  // ###########################################################################
  // get helper
  // ###########################################################################

  /**
   * @param {ProgressLogController} plc
   * @param {Bug} bug 
   */
  getTestRunsByBug(plc, bug) {
    return plc.progressLog.testRuns.filter((testRun) => {
      return plc.util.isTestRunOfBug(testRun, bug);
    });
  },

  /**
   * @param {ProgressLogController} plc
   * @param {Bug} bug
   * @return {BugProgress}
   */
  getBugProgressByBug(plc, bug) {
    for (const bugProgress of plc.progressLog.bugProgresses) {
      if (plc.util.isBugProgressOfBug(bugProgress, bug)) {
        return bugProgress;
      }
    }
    return null;
  },

  /**
   * @param {ProgressLogController} plc 
   * @param {TestRun} testRun 
   * @param {Bug} bug 
   */
  isTestRunOfBug(plc, testRun, bug) {
    return testRun.projectName === bug.project.name && testRun.bugId === bug.id;
  },

  /**
   * @param {ProgressLogController} plc 
   * @param {BugProgress} bugProgress
   * @param {Bug} bug 
   */
  isBugProgressOfBug(plc, bugProgress, bug) {
    return bugProgress.projectName === bug.project.name && bugProgress.bugId === bug.id;
  }
};