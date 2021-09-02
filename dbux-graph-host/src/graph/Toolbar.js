import allApplications from '@dbux/data/src/applications/allApplications';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
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

  get focusController() {
    // TODO-M: focusController
    const { syncGraphContainer } = this.parent;
    return syncGraphContainer.graph.controllers.getComponent('FocusController');
  }

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

    toggleStackEnabled() {
      this.parent.setState({ stackEnabled: !this.parent.state.stackEnabled });
      this.parent.asyncStackContainer.refreshGraph();
    },

    searchContexts(searchTermContexts) {
      this.setState({ searchTermContexts });

      if (searchTermContexts) {
        this.componentManager.externals.emitCallGraphAction(UserActionType.CallGraphSearchContexts, { searchTerm: searchTermContexts });
      }

      const contextNodeManager = this.context.graphDocument.syncGraphContainer.graph.controllers.getComponent('ContextNodeManager');
      contextNodeManager.highlightBySearchTermContexts(searchTermContexts);
    },

    searchTraces(searchTermTraces) {
      this.setState({ searchTermTraces });

      if (searchTermTraces) {
        this.componentManager.externals.emitCallGraphAction(UserActionType.CallGraphSearchTraces, { searchTerm: searchTermTraces });
      }

      const contextNodeManager = this.context.graphDocument.syncGraphContainer.graph.controllers.getComponent('ContextNodeManager');
      contextNodeManager.highlightBySearchTermTraces(searchTermTraces);
    },
    clearThreadSelection() {
      allApplications.selection.data.threadSelection.clear();
    }
  }
}

export default Toolbar;