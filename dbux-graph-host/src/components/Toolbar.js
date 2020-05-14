import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

class Toolbar extends HostComponentEndpoint {
  init() {
    this.state.count = 38;
    this.state.syncMode = this.context.graphDocument.getTraceMode();
  }

  public = {
    async restart() {
      await this.componentManager.restart();
    },

    toggleSyncMode() {
      const graphRoot = this.parent.children.getComponent('GraphRoot');
      const focusController = graphRoot.controllers.getComponent('FocusController');
      const mode = focusController.toggleSyncMode();
      this.setState({ syncMode: mode });
    },

    switchTraceMode() {
      this.context.graphDocument.switchTraceMode();
    }
  }
}

export default Toolbar;