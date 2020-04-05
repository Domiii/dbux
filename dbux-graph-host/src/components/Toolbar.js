import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

class Toolbar extends HostComponentEndpoint {
  init() {
    this.setState({
      count: 38
    });
  }

  public = {
    addHi(n) {
      const { count } = this.state;
      this.setState({ count: count + n });
    }
  }
}

export default Toolbar;