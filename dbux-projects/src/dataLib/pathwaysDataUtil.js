import EmptyArray from '@dbux/common/src/util/EmptyArray';
import allApplications from '@dbux/data/src/applications/allApplications';
import TestRun from './TestRun';

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
   * @param {TestRun} testRun 
   * @param {Bug} bug 
   */
  isTestRunOfBug(pdp, testRun, bug) {
    return testRun.bugId === bug.id;
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

  getCodeChunkId(pdp, actionId) {
    const action = pdp.collections.userActions.getById(actionId);
    return pdp.util.getActionCodeChunkId(action);
  },

  getActionCodeChunkId(pdp, action) {
    const dp = pdp.util.getActionApplication(action)?.dataProvider;
    if (!dp) {
      return null;
    }

    const { trace: { traceId } } = action;
    return dp.util.getCodeChunkId(traceId);
  }
};