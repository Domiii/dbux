import KeyedComponentSet from '@dbux/graph-common/src/componentLib/KeyedComponentSet';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';
import PathwaysAction from './PathwaysAction';

class PathwaysView extends HostComponentEndpoint {
  /**
   * @type {KeyedComponentSet}
   */
  actions;

  init() {
    this.actions = new KeyedComponentSet(this, PathwaysAction);
  }

  handleRefresh() {
    const pdp = this.componentManager.externals.getPathwaysDataProvider();
    const entries = pdp.collections.userActions.getAll().map(action => {
      if (!action) {
        return null;
      }
      const {
        id,
        type,
        trace
      } = action;

      const typeName = UserActionType.getName(type);

      return {
        id,
        type,
        typeName,
        trace
      };
    });

    // TODO: entry.id is not enough.
    //      Override `getId` and `getEntryById` to also account for `practiceSessionId`
    this.actions.update(entries);
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