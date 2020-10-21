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

function formatTimeSpent(millis) {
  let seconds = Math.floor(millis / 1000);
  const minutes = Math.floor(seconds / 60);
  seconds = seconds - minutes * 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

class PathwaysView extends HostComponentEndpoint {
  steps;

  actionGroups;

  /**
   * @type {KeyedComponentSet}
   */
  actions;

  init() {
    // const cfg = {
    //   makeKey: this.makeEntryKey
    // };
    const cfg = null;
    this.steps = new KeyedComponentSet(this, PathwaysStep, cfg);
    this.actionGroups = new KeyedComponentSet(this.getActionGroupOwner, PathwaysActionGroup, cfg);
    this.actions = new KeyedComponentSet(this.getActionOwner, PathwaysAction, cfg);
  }

  // makeEntryKey = (entry) => {
  //   if (!entry) {
  //     return 'null';
  //   }
  //   return `${entry.sessionId}_${entry.id}`;
  // }

  getActionGroupOwner = (actionKey, { stepId }) => {
    const step = this.pdp.collections.steps.getById(stepId);
    return this.steps.getComponentByEntry(step);
  }

  getActionOwner = (actionKey, { groupId }) => {
    const actionGroup = this.pdp.collections.actionGroups.getById(groupId);
    return this.actionGroups.getComponentByEntry(actionGroup);
  }

  getIconUri(modeName, fileName) {
    if (!fileName) {
      return null;
    }
    return this.componentManager.externals.getClientResourceUri(`${modeName}/${fileName}`);
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

    const steps = pdp.collections.steps.getAll().
      filter(step => !!step).
      map(step => {
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
        const timeSpent = formatTimeSpent(pdp.util.getStepTimeSpent(stepId));
        const background = staticContextId && getStaticContextColor(themeMode, staticContextId) || 'default';
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
      });

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

    this.steps.update(steps);
    this.actionGroups.update(actionGroups);
    // this.actions.update(actions);
  }

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