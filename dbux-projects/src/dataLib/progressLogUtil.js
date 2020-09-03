import TestRun, { createTestRun, createTestRunWithPatchString } from './TestRun';
import BugProgress from './BugProgress';
import BugStatus from './BugStatus';

/** @typedef {import('../projectLib/Bug').default} Bug */
/** @typedef {import('./ProgressLogController').default} ProgressLogController */

export default {

  // ###########################################################################
  // processor (update BugProgress & TestRun)
  // ###########################################################################

  /**
   * @param {ProgressLogController} plc 
   * @param {Bug} bug 
   * @param {any} result 
   */
  async processBugProgress(plc, bug, result) {
    plc.progressLog.testRuns.push(await createTestRun(bug, result));

    plc.util.updateBugProgress(bug, result);

    await plc.save();
  },

  async processUnfinishTestRun(plc, bug, patchString) {
    plc.progressLog.testRuns.push(createTestRunWithPatchString(bug, patchString));
  
    await plc.save();
  },

  /**
   * @param {ProgressLogController} plc 
   * @param {Bug} bug 
   * @param {any} result 
   */
  updateBugProgress(plc, bug, result) {
    const bugProgress = plc.util.getOrCreateBugProgress(bug);
    
    bugProgress.updatedAt = Date.now();
    bugProgress.status = result.code ? BugStatus.Attempted : BugStatus.Solved;
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
  getOrCreateBugProgress(plc, bug) {
    let result = plc.util.getBugProgressByBug(bug);

    if (!result) {
      result = new BugProgress(bug);
      plc.progressLog.bugProgresses.push(result);
    }

    return result;
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