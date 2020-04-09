import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

class Toolbar extends HostComponentEndpoint {
  init() {
    this.state.count = 38;
  }

  public = {
    async restart() {
      await this.componentManager.restart();
    },

    addHi(n) {
      const { count } = this.state;
      this.setState({ count: count + n });
    }
  }
}

export default Toolbar;