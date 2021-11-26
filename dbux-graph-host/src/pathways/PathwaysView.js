import last from 'lodash/last';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import ThemeMode from '@dbux/graph-common/src/shared/ThemeMode';
import { getStaticContextColor } from '@dbux/graph-common/src/shared/contextUtil';
import allApplications from '@dbux/data/src/applications/allApplications';
import traceSelection from '@dbux/data/src/traceSelection';
import { makeStaticContextLocLabel } from '@dbux/data/src/helpers/makeLabels';

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
    if (this.context.doc.isAnalyzing()) {
      return this.stepGroups.getComponentByKey(step.stepGroupId);
    }
    else {
      return this.steps.getComponentByEntry(step);
    }
  }

  getActionOwner = (actionKey, { groupId }) => {
    const actionGroup = this.pdp.collections.actionGroups.getById(groupId);
    return this.actionGroups.getComponentByEntry(actionGroup);
  }

  // ###########################################################################
  // getters
  // ###########################################################################

  getIconUri(fileName, modeName = null) {
    if (!fileName) {
      return null;
    }
    if (!modeName) {
      const themeMode = this.componentManager.externals.getThemeMode();
      modeName = ThemeMode.getName(themeMode).toLowerCase();
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
    return staticContextId ? getStaticContextColor(themeMode, staticContextId) : '';
  }

  makeStep = (themeMode, step) => {
    const {
      _id: stepId,
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
        else {
          label = '(other)';
        }
        break;
      case StepType.CallGraph:
        label = '(Call Graph Investigation)';
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

    const iconUri = this.getIconUri(icon);
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

  filterNewGroups = (groups) => {
    const addedStaticTraceIds = new Set();
    const addedStaticContextIds = new Set();
    const newGroups = groups.filter((group) => {
      if (!group) {
        return false;
      }
      const action = this.pdp.util.getActionGroupAction(group._id);
      const trace = action?.trace;
      if (trace && !addedStaticTraceIds.has(trace.staticTraceId)) {
        addedStaticTraceIds.add(trace.staticTraceId);
        return true;
      }
      const staticContextId = this.pdp.util.getActionStaticContextId(action)?.staticContextId;
      if (staticContextId && !addedStaticContextIds.has(staticContextId)) {
        addedStaticContextIds.add(staticContextId);
        return true;
      }
      return false;
    });
    return newGroups;
  }

  makeTimelineData(themeMode) {
    // make stale data
    const actionGroups = this.pdp.collections.actionGroups.getAll();
    const newGroups = this.filterNewGroups(actionGroups);
    const MIN_STALE_TIME = 60 * 1000;
    let activeTimestamp = newGroups[0]?.createdAt;
    const staleIntervals = [];
    for (const group of newGroups) {
      if (group.createdAt > activeTimestamp) {
        staleIntervals.push({ start: activeTimestamp, end: group.createdAt });
      }
      activeTimestamp = group.createdAt + MIN_STALE_TIME;
    }
    const lastActive = activeTimestamp + MIN_STALE_TIME;

    const endTime = last(actionGroups) ? this.pdp.util.getActionGroupEndTime(last(actionGroups)) : Date.now();
    if (lastActive < endTime) {
      staleIntervals.push({ start: lastActive, end: endTime });
    }

    // make steps
    const steps = this.pdp.collections.steps.getAll().filter(step => !!step);
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
      [StepType.CallGraph]: () => 'cg',
      [StepType.Other]: () => 'o'
    };

    return {
      steps: steps.map(step => {
        return {
          createdAt: step.createdAt,
          timeSpent: this.pdp.util.getStepTimeSpent(step._id),
          background: this.makeStepBackground(step, themeMode),
          tag: makeTagByType[step.type](step)
        };
      }),
      staleIntervals
    };
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

    // TODO: get step's prepared data, not raw data
    let stepGroups;
    let steps;
    if (this.context.doc.isAnalyzing()) {
      // analyze mode
      // stepGroups
      stepGroups = pdp.indexes.steps.byGroup.getAllKeys().map(stepGroupId => {
        const timeSpentMillis = pdp.indexes.steps.byGroup.
          get(stepGroupId).
          reduce((a, step) => a + pdp.util.getStepTimeSpent(step._id), 0);

        return {
          _id: stepGroupId,
          timeSpentMillis,
          timeSpent: formatTimeSpent(timeSpentMillis),
          firstStep: this.makeStep(themeMode, pdp.indexes.steps.byGroup.getFirst(stepGroupId))
        };
      });
      stepGroups.sort((a, b) => b.timeSpentMillis - a.timeSpentMillis);

      // steps
      steps = EmptyArray;

      const timelineUpdate = this.makeTimelineData(themeMode);
      let timeLineComponent = this.children.getComponent('PathwaysTimeline');
      if (timeLineComponent) {
        timeLineComponent.setState(timelineUpdate);
      }
      else {
        this.children.createComponent('PathwaysTimeline', timelineUpdate);
      }
    }
    else {
      // non-analyze mode
      steps = pdp.collections.steps.getAll().
        filter(step => !!step).
        map(step => this.makeStep(themeMode, step));
    }


    const actionGroups = pdp.collections.actionGroups.getAll().
      filter(actionGroup => actionGroup && !isHiddenGroup(actionGroup.type)).
      map(actionGroup => {
        const {
          _id: groupId,
          stepId,
          type
        } = actionGroup;

        const typeName = ActionGroupType.getName(type);
        const iconUri = this.getIconUri(getIconByActionGroup(type));
        const timeSpent = formatTimeSpent(pdp.util.getActionGroupTimeSpent(groupId));
        const hasTrace = !!pdp.util.getActionGroupAction(groupId)?.trace;
        const step = pdp.collections.steps.getById(stepId);
        const background = this.makeStepBackground(step, themeMode);
        const needsDivider = this.context.doc.isAnalyzing() &&
          this.pdp.util.isLastVisibleGroup(groupId) &&
          !this.pdp.util.isLastStepOfStepGroup(stepId);

        return {
          ...actionGroup,
          typeName,
          iconUri,
          timeSpent,
          hasTrace,
          background,
          needsDivider
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