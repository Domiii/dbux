import allApplications from '@dbux/data/src/applications/allApplications';
import StackMode from '@dbux/graph-common/src/shared/StackMode';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

/** @typedef { import("./GraphDocument").default } GraphDocument */

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
   * @type {GraphDocument}
   */
  get doc() {
    return this.parent;
  }

  /**
   * NOTE: `SyncGraph` only
   */
  get hiddenNodeManager() {
    const { syncGraphContainer } = this.doc;
    return syncGraphContainer.graph.controllers.getComponent('HiddenNodeManager');
  }

  public = {
    /**
     * hackfix for intellisense (which is not smart enough to look up `this.doc` correctly.)
     * @type {GraphDocument}
     */
    get doc() {
      return this.parent;
    },

    toggleFollowMode() {
      this.doc.toggleFollowMode();
    },

    hideOldRun(time) {
      this.hiddenNodeManager.hideBefore(time);
    },

    hideNewRun(time) {
      this.hiddenNodeManager.hideAfter(time);
    },

    nextGraphMode() {
      this.doc.nextGraphMode();
    },

    nextStackMode() {
      this.doc.setState({
        stackMode: StackMode.nextValue(this.parent.state.stackMode)
      });
      this.doc.asyncStackContainer.refreshGraph();
    },

    setSearchMode(mode) {
      this.doc.searchBar.setSearchMode(mode);
    },

    setFilter(filter) {
      // TODO: add filter button to client
      // TODO: only show button for "GraphContainer"s that have filter enabled
      // TODO: add filter logic here
    },

    clearThreadSelection() {
      allApplications.selection.data.threadSelection.clear();
    }
  }
}

export default Toolbar;