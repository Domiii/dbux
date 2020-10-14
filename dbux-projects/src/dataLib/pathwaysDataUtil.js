import EmptyArray from '@dbux/common/src/util/EmptyArray';
import allApplications from '@dbux/data/src/applications/allApplications';
import TestRun from './TestRun';
import BugProgress from './BugProgress';

/** @typedef {import('../projectLib/Bug').default} Bug */
/** @typedef {import('./PathwaysDataProvider').default} PathwaysDataProvider */

export default {
  // ###########################################################################
  // get helper
  // ###########################################################################

  /**
   * @param {PathwaysDataProvider} pdp
   * @param {Bug} bug 
   */
  getTestRunsByBug(pdp, bug) {
    return pdp.indexes.testRuns.byBugId.get(bug.id) || EmptyArray;
  },

  /**
   * @param {PathwaysDataProvider} pdp
   * @param {Bug} bug
   * @return {BugProgress}
   */
  getBugProgressByBug(pdp, bug) {
    return pdp.indexes.bugProgresses.byBugId.get(bug.id)?.[0] || null;
  },

  /**
   * @param {PathwaysDataProvider} pdp 
   * @param {TestRun} testRun 
   * @param {Bug} bug 
   */
  isTestRunOfBug(pdp, testRun, bug) {
    return testRun.projectName === bug.project.name && testRun.bugId === bug.id;
  },

  /**
   * @param {PathwaysDataProvider} pdp 
   * @param {BugProgress} bugProgress
   * @param {Bug} bug 
   */
  isBugProgressOfBug(pdp, bugProgress, bug) {
    return bugProgress.projectName === bug.project.name && bugProgress.bugId === bug.id;
  },

  // ###########################################################################
  // applications
  // ###########################################################################

  getApplication(pdp, actionId) {
    const action = pdp.collections.userActions.getById(actionId);
    return pdp.util.getActionApplication(action);
  },

  getActionApplication(pdp, action) {
    const { trace } = action;
    if (!trace) {
      return null;
    }

    const { applicationId } = trace;

    // TODO: need to also manage different application sets
    const applicationSet = allApplications;

    return applicationSet.getById(applicationId);
  },

  // ###########################################################################
  // steps + traces in pathways
  // ###########################################################################

  getStaticCodeChunkId(pdp, actionId) {
    const action = pdp.collections.userActions.getById(actionId);
    return pdp.util.getActionStaticCodeChunkId(action);
  },

  getActionStaticCodeChunkId(pdp, action) {
    const dp = pdp.util.getActionApplication(action)?.dataProvider;
    if (!dp) {
      return null;
    }

    const { trace: { traceId } } = action;
    return dp.util.getStaticCodeChunkId(traceId);
  }
};