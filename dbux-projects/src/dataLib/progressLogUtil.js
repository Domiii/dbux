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
   * After a attempt, store TestRun, updateBugProgress and save to ExternalStorage
   * @param {ProgressLogController} plc 
   * @param {Bug} bug 
   * @param {any} result 
   */
  async processBugRunResult(plc, bug, result) {
    // await plc.util.addTestRun(bug, result);
    // plc.util.maybeUpdateBugProgress(bug, result);
    // await plc.save();

    await plc.util.addTestRun(bug, result);
    plc.util.updateBugProgressStatusByResult(bug, result);
    await plc.save();
  },

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
  },

  /**
   * @param {ProgressLogController} plc 
   * @param {Bug} bug 
   * @param {Object} result 
   */
  maybeUpdateBugProgress(plc, bug, result) {
    const bugProgress = plc.util.getOrCreateBugProgress(bug);

    if (bugProgress.status !== BugStatus.Solved) {
      // only update when the first time solved
      bugProgress.updateAt = Date.now();
      bugProgress.status = result.code ? BugStatus.Attempted : BugStatus.Solved;
    }
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
    bugProgress.updateAt = Date.now();
  },

  /**
   * @param {ProgressLogController} plc 
   * @param {Bug} bug 
   * @param {Object} result
   */
  updateBugProgressStatusByResult(plc, bug, result) {
    const bugProgress = plc.util.getBugProgressByBug(bug);
    const resultStatus = result.code ? BugStatus.Attempted : BugStatus.Solved;
    
    // NOTE: only record the better ones
    if (bugProgress.status !== BugStatus.Solved) {
      bugProgress.status = resultStatus;
      bugProgress.updateAt = Date.now();
    }
  },

  /**
   * @param {ProgressLogController} plc 
   * @param {Bug} bug 
   * @param {boolean} stopwatchEnabled
   * @return {BugProgress}
   */
  addNewBugProgress(plc, bug, stopwatchEnabled, status = BugStatus.None) {
    const bugProgress = new BugProgress(bug, stopwatchEnabled, status);
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
   * @param {Bug} bug 
   */
  getOrCreateBugProgress(plc, bug, stopwatchEnabled) {
    let bugProgress = plc.util.getBugProgressByBug(bug);

    if (!bugProgress) {
      plc.util.addNewBugProgress(bug, stopwatchEnabled);
    }

    return bugProgress;
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