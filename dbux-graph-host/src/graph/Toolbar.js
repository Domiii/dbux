import allApplications from '@dbux/data/src/applications/allApplications';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

class Toolbar extends HostComponentEndpoint {
  init() {
    // TODO-M: use toolbar configuration in focus controller
    this.state.followMode = true;
    this.state.locMode = true;
    this.state.callMode = false;
    this.state.valueMode = false;
    this.state.thinMode = false;
    this.state.hideNewMode = this.hiddenNodeManager.hideNewMode;
    this.state.graphMode = this.context.graphDocument.graphMode;
    this.state.stackEnabled = false;
    this.state.asyncDetailMode = true;
    this.state.theradSelectionIconUri = this.context.graphDocument.getIconUri('filter.svg');

    // listen on mode changed event
    this.hiddenNodeManager.onStateChanged(({ hideBefore, hideAfter }) => {
      this.setState({
        hideOldMode: !!hideBefore,
        hideNewMode: !!hideAfter
      });
    });

    this.context.graphDocument.onGraphModeChanged(mode => {
      this.setState({ graphMode: mode });
    });

    this.focusController.on('modeChanged', (mode) => {
      this.setState({ followMode: mode });
    });

    const { threadSelection } = allApplications.selection.data;
    const threadSelectionSubscription = threadSelection.onSelectionChanged(() => {
      this.setState({ isThreadSelectionActive: threadSelection.isActive() });
    });
    this.addDisposable(threadSelectionSubscription);
    this.state.isThreadSelectionActive = threadSelection.isActive();
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
      this.focusController.toggleFollowMode();
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
      this.setState({ stackEnabled: !this.state.stackEnabled });
      this.parent.asyncStackContainer.refreshGraph();
    },

    searchContexts(searchTermContexts) {
      this.setState({ searchTermContexts });

      if (searchTermContexts) {
        this.componentManager.externals.emitCallGraphAction(UserActionType.CallGraphSearchContexts, { searchTerm: searchTermContexts });
      }

      const contextNodeManager = this.context.graphDocument.graphRoot.controllers.getComponent('ContextNodeManager');
      contextNodeManager.highlightBySearchTermContexts(searchTermContexts);
    },

    searchTraces(searchTermTraces) {
      this.setState({ searchTermTraces });

      if (searchTermTraces) {
        this.componentManager.externals.emitCallGraphAction(UserActionType.CallGraphSearchTraces, { searchTerm: searchTermTraces });
      }

      const contextNodeManager = this.context.graphDocument.graphRoot.controllers.getComponent('ContextNodeManager');
      contextNodeManager.highlightBySearchTermTraces(searchTermTraces);
    },
    clearThreadSelection() {
      allApplications.selection.data.threadSelection.clear();
    }
  }
}

export default Toolbar;