import UserActionType from '@dbux/data/src/pathways/UserActionType';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

class Toolbar extends HostComponentEndpoint {
  init() {
    this.state.syncMode = this.focusController.syncMode;
    this.state.locMode = true;
    this.state.callMode = false;
    this.state.valueMode = false;
    this.state.thinMode = false;
    this.state.hideNewMode = this.hiddenNodeManager.hideNewMode;
    this.state.asyncGraphMode = this.context.graphDocument.asyncGraphMode;

    // listen on mode changed event
    this.hiddenNodeManager.onStateChanged(({ hideBefore, hideAfter }) => {
      this.setState({
        hideOldMode: !!hideBefore,
        hideNewMode: !!hideAfter
      });
    });

    this.context.graphDocument.onAsyncGraphModeChanged(mode => {
      this.setState({ asyncGraphMode: mode });
    });

    this.focusController.on('modeChanged', (mode) => {
      this.setState({ syncMode: mode });
    });
  }

  get focusController() {
    const graphRoot = this.parent.children.getComponent('GraphRoot');
    return graphRoot.controllers.getComponent('FocusController');
  }

  get hiddenNodeManager() {
    const graphRoot = this.parent.children.getComponent('GraphRoot');
    return graphRoot.controllers.getComponent('HiddenNodeManager');
  }

  public = {
    toggleSyncMode() {
      this.focusController.toggleSyncMode();
    },

    hideOldRun(time) {
      this.hiddenNodeManager.hideBefore(time);
    },

    hideNewRun(time) {
      this.hiddenNodeManager.hideAfter(time);
    },

    setAsyncGraphMode(mode) {
      this.context.graphDocument.setAsyncGraphMode(mode);
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


  }
}

export default Toolbar;