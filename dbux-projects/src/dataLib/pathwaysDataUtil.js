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
  // actions
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
  },

  getPreviousAction(pdp, actionId) {
    const previousAction = pdp.collections.actions.getById(actionId - 1);
    return previousAction;
  },

  getNextAction(pdp, actionId) {
    const nextAction = pdp.collections.actions.getById(actionId + 1);
    return nextAction;
  },

  getActionTimeSpent(pdp, actionId) {
    const action = pdp.collections.actions.getById(actionId);
    const nextAction = pdp.util.getAction(actionId);
    if (nextAction) {
      return nextAction.createdAt - action.createdAt;
    }
    return Date.now() - action.createdAt;
  },

  
  // ###########################################################################
  // actionGroup
  // ###########################################################################

  getPreviousActionGroup(pdp, actionGroupId) {
    const previousActionGroup = pdp.collections.actionGroups.getById(actionGroupId - 1);
    return previousActionGroup;
  },

  getNextActionGroup(pdp, actionGroupId) {
    const nextActionGroup = pdp.collections.actionGroups.getById(actionGroupId + 1);
    return nextActionGroup;
  },

  getActionGroupTimeSpent(pdp, actionGroupId) {
    const actionGroup = pdp.collections.actionGroups.getById(actionGroupId);
    const nextActionGroup = pdp.util.getActionGroup(actionGroupId);

    if (nextActionGroup) {
      return nextActionGroup.createdAt - actionGroup.createdAt;
    }
    return Date.now() - actionGroup.createdAt;
  },
  
  // ###########################################################################
  // steps
  // ###########################################################################

  getPreviousStep(pdp, stepId) {
    const previousStep = pdp.collections.steps.getById(stepId - 1);
    return previousStep;
  },

  getNextStep(pdp, stepId) {
    const nextStep = pdp.collections.steps.getById(stepId + 1);
    return nextStep;
  },

  getStepTimeSpent(pdp, stepId) {
    const step = pdp.collections.steps.getById(stepId);
    const nextStep = pdp.util.getStep(stepId);
    if (nextStep) {
      return nextStep.createdAt - step.createdAt;
    }
    return Date.now() - step.createdAt;
  }
};