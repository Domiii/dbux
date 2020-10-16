import EmptyArray from '@dbux/common/src/util/EmptyArray';
import allApplications from '@dbux/data/src/applications/allApplications';
import { isGroupTypeClumped, getGroupTypeByActionType } from '@dbux/data/src/pathways/ActionGroupType';
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

    const applicationSet = allApplications;
    return applicationSet.getById(applicationId);
  },


  // ###########################################################################
  // actions
  // ###########################################################################

  getPreviousAction(pdp, actionId) {
    const previousAction = pdp.collections.actions.getById(actionId - 1);
    return previousAction;
  },

  getNextAction(pdp, actionId) {
    const nextAction = pdp.collections.actions.getById(actionId + 1);
    return nextAction;
  },

  getLastAction(pdp) {
    return pdp.collections.actionGroups.getLast();
  },

  getActionTimeSpent(pdp, actionId) {
    const action = pdp.collections.actions.getById(actionId);
    if (action.endTime) {
      return action.endTime - action.createdAt;
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

  getLastActionGroup(pdp) {
    return pdp.collections.actionGroups.getLast();
  },

  getActionGroupTimeSpent(pdp, actionGroupId) {
    const actionGroup = pdp.collections.actionGroups.getById(actionGroupId);
    if (actionGroup.endTime) {
      return actionGroup.endTime - actionGroup.createdAt;
    }
    return Date.now() - actionGroup.createdAt;
  },

  shouldClumpNextActionIntoGroup(pdp, action, group) {
    const groupType = getGroupTypeByActionType(action.type);
    return groupType === group.type && isGroupTypeClumped(groupType);
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

  getLastStep(pdp) {
    return pdp.collections.steps.getLast();
  },

  getStepTimeSpent(pdp, stepId) {
    const step = pdp.collections.steps.getById(stepId);
    // const nextStep = pdp.util.getNextStep(stepId);
    // if (nextStep) {
    //   return nextStep.createdAt - step.createdAt;
    // }
    if (step.endTime) {
      return step.endTime - step.createdAt;
    }
    return Date.now() - step.createdAt;
  },



  // ###########################################################################
  // code chunks + functions
  // ###########################################################################

  // getCodeChunkId(pdp, actionId) {
  //   const action = pdp.collections.userActions.getById(actionId);
  //   return pdp.util.getActionCodeChunkId(action);
  // },

  // getActionCodeChunkId(pdp, action) {
  //   const dp = pdp.util.getActionApplication(action)?.dataProvider;
  //   if (!dp) {
  //     return null;
  //   }

  //   const { trace: { traceId } } = action;
  //   return dp.util.getCodeChunkId(traceId);
  // },


  getStaticContextId(pdp, actionId) {
    const action = pdp.collections.userActions.getById(actionId);
    return pdp.util.getActionCodeChunkId(action);
  },

  getActionStaticContextId(pdp, action) {
    const dp = pdp.util.getActionApplication(action)?.dataProvider;
    if (!dp) {
      return null;
    }

    const { trace: { contextId } } = action;
    const { staticContextId } = dp.collections.executionContexts.getById(contextId);
    // const staticContext = dp.collections.staticContexts.getById(staticContextId);
    return staticContextId;
  },
};