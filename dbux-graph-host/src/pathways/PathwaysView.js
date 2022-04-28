import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { formatTime } from '@dbux/common-node/src/util/timeUtil';
import allApplications from '@dbux/data/src/applications/allApplications';
import traceSelection from '@dbux/data/src/traceSelection';

import KeyedComponentSet from '@dbux/graph-common/src/componentLib/KeyedComponentSet';
import { isHiddenGroup } from '@dbux/data/src/pathways/ActionGroupType';
import StepType from '@dbux/data/src/pathways/StepType';
import { makeStaticContextLocLabel } from '@dbux/data/src/helpers/makeLabels';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';
import PathwaysStep from './PathwaysStep';
import PathwaysActionGroup from './PathwaysActionGroup';
import PathwaysStepGroup from './PathwaysStepGroup';
import { getIconByStep, makeStepBackground } from './renderSettings';



class PathwaysView extends HostComponentEndpoint {
  /**
   * @type {KeyedComponentSet}
   */
  stepGroups;
  /**
   * @type {KeyedComponentSet}
   */
  steps;
  /**
   * @type {KeyedComponentSet}
   */
  actionGroups;
  // /**
  //  * @type {KeyedComponentSet}
  //  */
  // actions;

  get pdp() {
    return this.context.doc.pdp;
  }

  // ###########################################################################
  // init + reset
  // ###########################################################################

  init() {
    // const cfg = {
    //   makeKey: this.makeEntryKey
    // };
    this._doInit();
  }

  update() {
  }

  _doInit() {
    const cfg = null;
    this.stepGroups = new KeyedComponentSet(this, PathwaysStepGroup, cfg);
    this.steps = new KeyedComponentSet(this.getStepOwner, PathwaysStep, cfg);
    this.actionGroups = new KeyedComponentSet(this.getActionGroupOwner, PathwaysActionGroup, cfg);
    // this.actions = new KeyedComponentSet(this.getActionOwner, PathwaysAction, cfg);
    this.timeline = this.children.createComponent('PathwaysTimeline');
  }

  reset() {
    // remove all children
    this.clearChildren();

    // re-create bookkeeping
    this._doInit();
  }

  // ###########################################################################
  // children organization
  // ###########################################################################

  getStepOwner = (actionKey, { stepGroupId }) => {
    if (this.context.doc.isAnalyzing()) {
      return this.stepGroups.getComponentByKey(stepGroupId);
    }
    return this;
  }

  getActionGroupOwner = (actionKey, { stepId }) => {
    const step = this.pdp.collections.steps.getById(stepId);
    if (this.context.doc.isAnalyzing()) {
      return this.stepGroups.getComponentByKey(step.stepGroupId);
    }
    else {
      return this.steps.getComponentByEntry(step);
    }
  }

  // getActionOwner = (actionKey, { groupId }) => {
  //   const actionGroup = this.pdp.collections.actionGroups.getById(groupId);
  //   return this.actionGroups.getComponentByEntry(actionGroup);
  // }

  // ###########################################################################
  // handleRefresh
  // ###########################################################################

  handleRefresh() {
    const { pdp } = this;

    if (!this.pdp) {
      return;
    }

    // TODO: get step's prepared data, not raw data
    let stepGroups;
    let steps;
    if (this.context.doc.isAnalyzing()) {
      // analyze mode
      // stepGroups
      stepGroups = pdp.indexes.steps.byGroup.getAllKeys().map(stepGroupId => {
        const timeSpentMillis = pdp.indexes.steps.byGroup.get(stepGroupId).
          reduce((a, step) => a + pdp.util.getStepTimeSpent(step._id), 0);

        return {
          _id: stepGroupId,
          timeSpentMillis,
          timeSpent: formatTime(timeSpentMillis),
          firstStep: this.makeStep(pdp.indexes.steps.byGroup.getFirst(stepGroupId)),
        };
      });
      stepGroups.sort((a, b) => b.timeSpentMillis - a.timeSpentMillis);

      // steps
      steps = EmptyArray;
    }
    else {
      // non-analyze mode
      steps = pdp.collections.steps.getAllActual();
    }


    const actionGroups = pdp.collections.actionGroups.getAll().
      filter(actionGroup => actionGroup && !isHiddenGroup(actionGroup.type));

    // const actions = pdp.collections.userActions.getAll().
    //   filter(action => action && !isHiddenAction(action.type)).
    //   map(action => {
    //     const {
    //       type
    //     } = action;

    //     const typeName = UserActionType.getName(type);

    //     return {
    //       ...action,
    //       typeName
    //     };
    //   });

    stepGroups && this.stepGroups.update(stepGroups);
    this.steps.update(steps);
    this.actionGroups.update(actionGroups);
    // this.actions.update(actions);

    // update timeline
    this.timeline.forceUpdate();
  }

  /**
   * NOTE: `PathwaysStep` and `PathwaysStepGroup` share this function, so put it here to avoid code duplication
   * @returns extra `Step` data
   */
  makeStep(step) {
    const {
      _id: stepId,
      applicationId,
      staticContextId,
      type: stepType
    } = step;

    const { themeMode } = this.context;

    let label;
    let locLabel;
    switch (stepType) {
      case StepType.Trace:
        if (staticContextId) {
          const dp = allApplications.getById(applicationId)?.dataProvider;
          const staticContext = dp?.collections.staticContexts.getById(staticContextId);
          const parentStaticContext = dp?.collections.staticContexts.getById(staticContext?.parentId);
          label = staticContext?.displayName || parentStaticContext?.displayName || `(could not look up application or staticContext for ${applicationId}, ${staticContextId})`;
          const locString = makeStaticContextLocLabel(applicationId, staticContextId);
          locLabel = ` @ ${locString}`;
        }
        else {
          label = '(other)';
        }
        break;
      case StepType.CallGraph:
        label = '(Call Graph Investigation)';
        break;
      case StepType.Search:
        label = '(Search)';
        break;
      case StepType.Other:
        if (staticContextId) {
          const dp = allApplications.getById(applicationId)?.dataProvider;
          const staticContext = dp?.collections.staticContexts.getById(staticContextId);
          label = staticContext?.displayName || `(could not look up application or staticContext for ${applicationId}, ${staticContextId})`;
          const locString = makeStaticContextLocLabel(applicationId, staticContextId);
          locLabel = ` @ ${locString}`;
        }
        else {
          label = '(other)';
        }
        break;
      case StepType.None:
      default:
        label = '(Start)';
        break;
    }

    /**
     * hackfix: currently we have not recorded the trace data, so we temporarily set it to `StepType.Other`
     */
    let icon;
    if (StepType.is.Trace(stepType) && !staticContextId) {
      icon = getIconByStep(StepType.Other);
    }
    else {
      icon = getIconByStep(stepType);
    }

    return {
      label,
      locLabel,
      iconUri: this.context.doc.getIconUri(icon),
      timeSpent: formatTime(this.pdp.util.getStepTimeSpent(stepId)),
      background: makeStepBackground(step, themeMode),
      hasTrace: StepType.is.Trace(stepType),
    };
  }


  // ###########################################################################
  // shared + public
  // ###########################################################################

  shared() {
    return {
      context: {
        view: this
      }
    };
  }

  public = {
    selectStepTrace(stepId) {
      const trace = this.pdp.util.getStepAction(stepId)?.trace;
      if (trace) {
        traceSelection.selectTrace(trace);
      }
    },

    selectGroupTrace(groupId) {
      const trace = this.pdp.util.getActionGroupAction(groupId)?.trace;
      if (trace) {
        traceSelection.selectTrace(trace);
      }
    },

    selectStepStaticTrace(stepId) {
      const step = this.pdp.collections.steps.getById(stepId);
      const { applicationId, staticContextId } = step;
      if (applicationId && staticContextId) {
        const dp = allApplications.getById(applicationId).dataProvider;
        const firstTrace = dp.indexes.traces.byStaticContext.getFirst(staticContextId);
        if (firstTrace) {
          traceSelection.selectTrace(firstTrace);
        }
      }
    },
    async gotoActionGroupEditorPosition(actionGroupId) {
      // const actionGroup = this.pdp.collections.steps.getById(actionGroupId);
      const action = this.pdp.indexes.userActions.byGroup.getFirst(actionGroupId);
      if (action?.file && action.range) {
        await this.componentManager.externals.goToCodeLoc(action.file, action.range);
      }
    }
  }
}

export default PathwaysView;