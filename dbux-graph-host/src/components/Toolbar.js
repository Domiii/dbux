import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

class Toolbar extends HostComponentEndpoint {
  init() {
    this.state.count = 38;
    this.state.syncMode = true;
  }

  public = {
    async restart() {
      await this.componentManager.restart();
    },

    addHi(n) {
      const { count } = this.state;
      this.setState({ count: count + n });
    },

    toggleSyncMode() {
      const graphRoot = this.parent.children.getComponent('GraphRoot');
      const focusController = graphRoot.controllers.getComponent('FocusController');
      const mode = focusController.toggleSyncMode();
      this.setState({ syncMode: mode });
    },

    switchTraceMode() {
      this.componentManager.doc.switchTraceMode();
    }
  }
}

export default Toolbar;