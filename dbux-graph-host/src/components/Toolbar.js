import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

class Toolbar extends HostComponentEndpoint {
  init() {
    this.state.syncMode = this.focusController.syncMode;
    this.state.locMode = true;
    this.state.callMode = false;
    this.state.valueMode = false;
    this.state.thinMode = false;
    this.state.hideNewMode = this.hiddenNodeManager.hideNewMode;
    // 
    this.state.themeMode = this.context.themeMode;

    // listen on hiddenModeChanged event to sync hideMode
    this.hiddenNodeManager.onStateChanged(({ hideBefore, hideAfter }) => {
      this.setState({
        hideOldMode: !!hideBefore,
        hideNewMode: !!hideAfter
      });
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
      const mode = this.focusController.toggleSyncMode();
    },

    hideOldRun(time) {
      this.hiddenNodeManager.hideBefore(time);
    },

    hideNewRun(time) {
      this.hiddenNodeManager.hideAfter(time);
    },

    search(searchTerm) {
      this.setState({ searchTerm });
      
      const contextNodeManager = this.context.graphDocument.graphRoot.controllers.getComponent('ContextNodeManager');
      contextNodeManager.highlightBySearchTerm(searchTerm);
    }
  }
}

export default Toolbar;