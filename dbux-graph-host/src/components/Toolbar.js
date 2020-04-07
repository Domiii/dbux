import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

class Toolbar extends HostComponentEndpoint {
  init() {
    this.state.count = 38;
  }

  public = {
    async restartApp() {
      await this.componentManager.externals.restartApp();
    },

    gotoHome() {
      
    },

    addHi(n) {
      const { count } = this.state;
      this.setState({ count: count + n });
    }
  }
}

export default Toolbar;