import EmptyArray from '@dbux/common/src/util/EmptyArray';
import TestRun from './TestRun';
import BugProgress from './BugProgress';

/** @typedef {import('../projectLib/Bug').default} Bug */
/** @typedef {import('./PathwayDataProvider').default} PathwayDataProvider */

export default {
  // ###########################################################################
  // get helper
  // ###########################################################################

  /**
   * @param {PathwayDataProvider} pdp
   * @param {Bug} bug 
   */
  getTestRunsByBug(pdp, bug) {
    return pdp.indexes.testRuns.byBugId.get(bug.id) || EmptyArray;
  },

  /**
   * @param {PathwayDataProvider} pdp
   * @param {Bug} bug
   * @return {BugProgress}
   */
  getBugProgressByBug(pdp, bug) {
    return pdp.indexes.bugProgresses.byBugId.get(bug.id)?.[0] || null;
  },

  /**
   * @param {PathwayDataProvider} pdp 
   * @param {TestRun} testRun 
   * @param {Bug} bug 
   */
  isTestRunOfBug(pdp, testRun, bug) {
    return testRun.projectName === bug.project.name && testRun.bugId === bug.id;
  },

  /**
   * @param {PathwayDataProvider} pdp 
   * @param {BugProgress} bugProgress
   * @param {Bug} bug 
   */
  isBugProgressOfBug(pdp, bugProgress, bug) {
    return bugProgress.projectName === bug.project.name && bugProgress.bugId === bug.id;
  }
};