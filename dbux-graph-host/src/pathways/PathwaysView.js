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
    // const cfg = {
    //   makeKey: this.makeEntryKey
    // };
    const cfg = null;
    this.steps = new KeyedComponentSet(this, PathwaysStep, cfg);
    this.actions = new KeyedComponentSet(this.getActionOwner, PathwaysAction, cfg);
  }

  // makeEntryKey = (entry) => {
  //   if (!entry) {
  //     return 'null';
  //   }
  //   return `${entry.sessionId}_${entry.id}`;
  // }

  getActionOwner = (actionKey, { stepId }) => {
    const step = this.pdp.collections.steps.getById(stepId);
    return this.steps.getComponentByEntry(step);
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

      const {
        id,
        sessionId,
        codeChunkId
      } = step;

      return {
        id,
        sessionId,
        codeChunkId
      };
    });

    const actions = pdp.collections.userActions.getAll().map(action => {
      if (!action) {
        // the first entry is empty
        return null;
      }

      const {
        id,
        sessionId,
        type,
        trace,
        stepId
      } = action;

      const typeName = UserActionType.getName(type);

      return {
        id,
        sessionId,
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