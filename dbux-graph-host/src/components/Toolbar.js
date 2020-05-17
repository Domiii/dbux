import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

class Toolbar extends HostComponentEndpoint {
  init() {
    this.state.syncMode = this.context.graphDocument.getTraceMode();
    this.state.locMode = true;
    this.state.thinMode = false;
    this.state.valueMode = false;
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