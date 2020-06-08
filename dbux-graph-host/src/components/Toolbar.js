import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

class Toolbar extends HostComponentEndpoint {
  init() {
    this.state.syncMode = this.focusController.syncMode;
    this.state.locMode = true;
    this.state.callMode = false;
    this.state.valueMode = false;
    this.state.thinMode = false;
  }

  get focusController() {
    const graphRoot = this.parent.children.getComponent('GraphRoot');
    return graphRoot.controllers.getComponent('FocusController');
  }

  public = {
    async restart() {
      await this.componentManager.restart();
    },

    async toggleSyncMode() {
      const mode = await this.focusController.toggleSyncMode();
      this.setState({ syncMode: mode });
    },
  }
}

export default Toolbar;