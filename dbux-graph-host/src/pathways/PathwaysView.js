import KeyedComponentSet from '@dbux/graph-common/src/componentLib/KeyedComponentSet';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';
import PathwaysStep from './PathwaysStep';
import PathwaysAction from './PathwaysAction';

class PathwaysView extends HostComponentEndpoint {
  steps;

  /**
   * @type {KeyedComponentSet}
   */
  actions;

  init() {
    this.steps = new KeyedComponentSet(this, PathwaysStep);
    this.actions = new KeyedComponentSet(this.getActionOwner, PathwaysAction);
  }

  getActionOwner = (actionId, { stepId }) => {
    return this.steps.getComponentById(stepId);
  }

  handleRefresh() {
    const pdp = this.componentManager.externals.getPathwaysDataProvider();

    const steps = pdp.collections.steps.getAll().map(step => {
      if (!step) {
        // the first entry is empty
        return null;
      }

      const {
        id,
        staticCodeChunkId
      } = step;

      return {
        id,
        staticCodeChunkId
      };
    });

    const actions = pdp.collections.userActions.getAll().map(action => {
      if (!action) {
        // the first entry is empty
        return null;
      }

      const {
        id,
        type,
        trace,
        stepId
      } = action;

      const typeName = UserActionType.getName(type);

      return {
        id,
        type,
        typeName,
        trace,
        stepId
      };
    });

    this.steps.update(steps);
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