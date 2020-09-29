import EmptyArray from '@dbux/common/src/util/EmptyArray';
import TestRun from './TestRun';
import BugProgress from './BugProgress';

/** @typedef {import('../projectLib/Bug').default} Bug */
/** @typedef {import('./ProgressLogController').default} ProgressLogController */

export default {
  // ###########################################################################
  // get helper
  // ###########################################################################

  /**
   * @param {ProgressLogController} plc
   * @param {Bug} bug 
   */
  getTestRunsByBug(plc, bug) {
    return plc.indexes.testRuns.byBugId.get(bug.id) || EmptyArray;
  },

  /**
   * @param {ProgressLogController} plc
   * @param {Bug} bug
   * @return {BugProgress}
   */
  getBugProgressByBug(plc, bug) {
    return plc.indexes.bugProgresses.byBugId.get(bug.id)?.[0] || null;
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