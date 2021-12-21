import allApplications from '@dbux/data/src/applications/allApplications';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import StackMode from '@dbux/graph-common/src/shared/StackMode';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

class Toolbar extends HostComponentEndpoint {
  init() {
    const { threadSelection } = allApplications.selection.data;
    this.state.theradSelectionIconUri = this.context.graphDocument.getIconUri('filter.svg');
    this.state.isThreadSelectionActive = threadSelection.isActive();

    // listen on mode changed event
    this.hiddenNodeManager.onStateChanged(() => {
      this.forceUpdate();
    });

    const threadSelectionSubscription = threadSelection.onSelectionChanged(() => {
      this.setState({ isThreadSelectionActive: threadSelection.isActive() });
    });
    this.addDisposable(threadSelectionSubscription);
  }

  /**
   * NOTE: `SyncGraph` only
   */
  get hiddenNodeManager() {
    const { syncGraphContainer } = this.parent;
    return syncGraphContainer.graph.controllers.getComponent('HiddenNodeManager');
  }

  public = {
    toggleFollowMode() {
      this.parent.toggleFollowMode();
    },

    hideOldRun(time) {
      this.hiddenNodeManager.hideBefore(time);
    },

    hideNewRun(time) {
      this.hiddenNodeManager.hideAfter(time);
    },

    nextGraphMode() {
      this.parent.nextGraphMode();
    },

    nextStackMode() {
      this.parent.setState({
        stackMode: StackMode.nextValue(this.parent.state.stackMode)
      });
      this.parent.asyncStackContainer.refreshGraph();
    },

    setSearchMode(mode) {
      this.context.graphDocument.searchBar.setSearchMode(mode);
      this.forceUpdate();
    },

    clearThreadSelection() {
      allApplications.selection.data.threadSelection.clear();
    }
  }
}

export default Toolbar;