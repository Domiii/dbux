import ThemeMode from '@dbux/graph-common/src/shared/ThemeMode';
import allApplications from '@dbux/data/src/applications/allApplications';
// import { makeContextLabel } from '@dbux/data/src/helpers/contextLabels';
import { makeStaticContextLocLabel } from '@dbux/data/src/helpers/traceLabels';

import KeyedComponentSet from '@dbux/graph-common/src/componentLib/KeyedComponentSet';
// import UserActionType from '@dbux/data/src/pathways/UserActionType';
import ActionGroupType, { isHiddenGroup, isHiddenAction } from '@dbux/data/src/pathways/ActionGroupType';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';
import PathwaysStep from './PathwaysStep';
import PathwaysAction from './PathwaysAction';
import PathwaysActionGroup from './PathwaysActionGroup';
import { getIconByActionGroup } from './renderSettings';

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

  handleRefresh() {
    const { themeMode } = this.context;
    const modeName = ThemeMode.getName(themeMode).toLowerCase();

    const pdp = this.componentManager.externals.getPathwaysDataProvider();
    if (this.pdp !== pdp) {
      // reset
      this.children.clear();
      this.init();
    }
    this.pdp = pdp;

    const steps = pdp.collections.steps.getAll().
      filter(step => !!step).
      map(step => {
        const {
          applicationId,
          staticContextId,
          // contextId
        } = step;

        let label;
        let locLabel;
        if (staticContextId) {
          const dp = allApplications.getById(applicationId)?.dataProvider;
          const staticContext = dp?.collections.staticContexts.getById(staticContextId);
          label = staticContext?.displayName || `(could not look up application or staticContext for ${applicationId}, ${staticContextId})`;
          const locString = makeStaticContextLocLabel(applicationId, staticContextId);
          locLabel = ` @ ${locString}`;
        }
        else {
          label = '(new test run)';
          locLabel = '';
        }

        return {
          label,
          locLabel,
          ...step
        };
      });

    const actionGroups = pdp.collections.actionGroups.getAll().
      filter(actionGroup => actionGroup && !isHiddenGroup(actionGroup.type)).
      map(actionGroup => {
        const {
          type
        } = actionGroup;

        const typeName = ActionGroupType.getName(type);
        const file = getIconByActionGroup(type);
        const iconUri = this.componentManager.externals.getClientResourceUri(`${modeName}/${file}`);
        return {
          ...actionGroup,
          typeName,
          iconUri
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
}

export default PathwaysView;