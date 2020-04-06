import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

class Toolbar extends HostComponentEndpoint {
  init() {
    this.state.count = 38;
  }

  public = {
    gotoHome() {
      
    },

    addHi(n) {
      const { count } = this.state;
      this.setState({ count: count + n });
    }
  }
}

export default Toolbar;