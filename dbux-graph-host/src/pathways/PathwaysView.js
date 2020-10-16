import KeyedComponentSet from '@dbux/graph-common/src/componentLib/KeyedComponentSet';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';
import PathwaysStep from './PathwaysStep';
import PathwaysAction from './PathwaysAction';
import PathwaysActionGroup from './PathwaysActionGroup';

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
    const pdp = this.componentManager.externals.getPathwaysDataProvider();
    if (this.pdp !== pdp) {
      // reset
      this.children.clear();
      this.init();
    }
    this.pdp = pdp;

    const steps = pdp.collections.steps.getAll().map(step => {
      if (!step) {
        // the first entry is empty
        return null;
      }

      return step;
    });

    const actionGroups = pdp.collections.actionGroups.getAll().map(actionGroup => {
      if (!actionGroup) {
        // the first entry is empty
        return null;
      }

      return actionGroup;
    });

    const actions = pdp.collections.userActions.getAll().map(action => {
      if (!action) {
        // the first entry is empty
        return null;
      }

      const {
        type
      } = action;

      const typeName = UserActionType.getName(type);

      return {
        ...action,
        typeName
      };
    });

    this.steps.update(steps);
    this.actionGroups.update(actionGroups);
    this.actions.update(actions);
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