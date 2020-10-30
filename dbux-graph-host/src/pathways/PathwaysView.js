import ThemeMode from '@dbux/graph-common/src/shared/ThemeMode';
import { getStaticContextColor } from '@dbux/graph-common/src/shared/contextUtil';
import allApplications from '@dbux/data/src/applications/allApplications';
import traceSelection from '@dbux/data/src/traceSelection';
// import { makeContextLabel } from '@dbux/data/src/helpers/contextLabels';
import { makeStaticContextLocLabel } from '@dbux/data/src/helpers/traceLabels';

import KeyedComponentSet from '@dbux/graph-common/src/componentLib/KeyedComponentSet';
// import UserActionType from '@dbux/data/src/pathways/UserActionType';
import StepType from '@dbux/data/src/pathways/StepType';
import ActionGroupType, { isHiddenGroup, isHiddenAction } from '@dbux/data/src/pathways/ActionGroupType';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';
import PathwaysStep from './PathwaysStep';
import PathwaysAction from './PathwaysAction';
import PathwaysActionGroup from './PathwaysActionGroup';
import { getIconByActionGroup, getIconByStep } from './renderSettings';
import PathwaysStepGroup from './PathwaysStepGroup';

function formatTimeSpent(millis) {
  let seconds = Math.floor(millis / 1000);
  const minutes = Math.floor(seconds / 60);
  seconds = seconds - minutes * 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

class PathwaysView extends HostComponentEndpoint {
  stepGroups;
  steps;
  actionGroups;
  /**
   * @type {KeyedComponentSet}
   */
  actions;

  // ###########################################################################
  // init + reset
  // ###########################################################################

  init() {
    // const cfg = {
    //   makeKey: this.makeEntryKey
    // };
    this._doInit();
  }

  _doInit() {
    const cfg = null;
    this.stepGroups = new KeyedComponentSet(this, PathwaysStepGroup, cfg);
    this.steps = new KeyedComponentSet(this.getStepOwner, PathwaysStep, cfg);
    this.actionGroups = new KeyedComponentSet(this.getActionGroupOwner, PathwaysActionGroup, cfg);
    this.actions = new KeyedComponentSet(this.getActionOwner, PathwaysAction, cfg);
  }

  reset() {
    // re-create bookkeeping
    this._doInit();

    // remove all children
    this.clearChildren();
  }

  // ###########################################################################
  // children organization
  // ###########################################################################

  // makeEntryKey = (entry) => {
  //   if (!entry) {
  //     return 'null';
  //   }
  //   return `${entry.sessionId}_${entry.id}`;
  // }

  getStepOwner = (actionKey, { stepGroupId }) => {
    if (this.context.doc.isAnalyzing()) {
      return this.stepGroups.getComponentByKey(stepGroupId);
    }
    return this;
  }

  getActionGroupOwner = (actionKey, { stepId }) => {
    const step = this.pdp.collections.steps.getById(stepId);
    return this.steps.getComponentByEntry(step);
  }

  getActionOwner = (actionKey, { groupId }) => {
    const actionGroup = this.pdp.collections.actionGroups.getById(groupId);
    return this.actionGroups.getComponentByEntry(actionGroup);
  }

  // ###########################################################################
  // getters
  // ###########################################################################

  getIconUri(modeName, fileName) {
    if (!fileName) {
      return null;
    }
    return this.componentManager.externals.getClientResourceUri(`${modeName}/${fileName}`);
  }

  // ###########################################################################
  // update
  // ###########################################################################

  update() {
  }

  // ###########################################################################
  // handleRefresh
  // ###########################################################################

  makeStepBackground(step, themeMode) {
    const { staticContextId } = step;
    return staticContextId ? getStaticContextColor(themeMode, staticContextId) : 'default';
  }

  makeStep = (themeMode, modeName, step) => {
    const {
      id: stepId,
      applicationId,
      staticContextId,
      type: stepType
      // contextId
    } = step;

    let label;
    let locLabel;
    switch (stepType) {
      case StepType.Trace:
        if (staticContextId) {
          const dp = allApplications.getById(applicationId)?.dataProvider;
          const staticContext = dp?.collections.staticContexts.getById(staticContextId);
          label = staticContext?.displayName || `(could not look up application or staticContext for ${applicationId}, ${staticContextId})`;
          const locString = makeStaticContextLocLabel(applicationId, staticContextId);
          locLabel = ` @ ${locString}`;
        }
        break;
      case StepType.CallGraph:
        label = '(Call Graph Investigation)';
        break;
      case StepType.None:
      default:
        label = '(Start)';
        break;
    }

    const iconUri = this.getIconUri(modeName, getIconByStep(stepType));
    const timeSpent = formatTimeSpent(this.pdp.util.getStepTimeSpent(stepId));
    const background = this.makeStepBackground(step, themeMode);
    const hasTrace = StepType.is.Trace(stepType);

    return {
      label,
      iconUri,
      locLabel,
      timeSpent,
      background,
      hasTrace,

      ...step
    };
  }

  makeTimelineSteps(themeMode) {
    const timelineSteps = this.pdp.collections.steps.getAll().filter(step => !!step);

    const makeTagByType = {
      [StepType.None]: () => 's',
      [StepType.Trace]: (step) => {
        if (step === this.pdp.indexes.steps.byType.get(step.type)?.[0]) {
          return 'sn';
        }
        else {
          return 'sr';
        }
      },
      [StepType.CallGraph]: () => 'cg'
    };

    return timelineSteps.map(step => {
      return {
        step,
        background: this.makeStepBackground(step, themeMode),
        tag: makeTagByType[step.type](step)
      };
    });
  }

  handleRefresh() {
    const pdp = this.componentManager.externals.getPathwaysDataProvider();
    if (this.pdp !== pdp) {
      // reset
      this.children.clear();
      this.init();
    }
    this.pdp = pdp;

    const { themeMode } = this.context;
    const modeName = ThemeMode.getName(themeMode).toLowerCase();

    // TODO: get step's prepared data, not raw data
    let stepGroups;
    if (this.context.doc.isAnalyzing()) {
      stepGroups = pdp.indexes.steps.byGroup.getAllKeys().map(stepGroupId => {
        const timeSpentMillis = pdp.indexes.steps.byGroup.
          get(stepGroupId).
          reduce((a, step) => a + pdp.util.getStepTimeSpent(step.id), 0);

        return {
          id: stepGroupId,
          timeSpentMillis,
          timeSpent: formatTimeSpent(timeSpentMillis),
          firstStep: this.makeStep(themeMode, modeName, pdp.indexes.steps.byGroup.getFirst(stepGroupId))
        };
      });
      stepGroups.sort((a, b) => b.timeSpentMillis - a.timeSpentMillis);

      this.children.createComponent('PathwaysTimeline', { steps: this.makeTimelineSteps(themeMode) });
    }
    const steps = pdp.collections.steps.getAll().
      filter(step => !!step).
      map(step => this.makeStep(themeMode, modeName, step));


    const actionGroups = pdp.collections.actionGroups.getAll().
      filter(actionGroup => actionGroup && !isHiddenGroup(actionGroup.type)).
      map(actionGroup => {
        const {
          id: groupId,
          type
        } = actionGroup;

        const typeName = ActionGroupType.getName(type);
        const iconUri = this.getIconUri(modeName, getIconByActionGroup(type));
        const timeSpent = formatTimeSpent(pdp.util.getActionGroupTimeSpent(groupId));
        const hasTrace = !!pdp.util.getActionGroupAction(groupId)?.trace;

        return {
          ...actionGroup,
          typeName,
          iconUri,
          timeSpent,
          hasTrace
        };
      });

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
    }
  }
}

export default PathwaysView;