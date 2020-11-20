import HostComponentEndpoint from '../../componentLib/HostComponentEndpoint';

class AsyncNode extends HostComponentEndpoint {
  init() {
    // const {
    //   threadId,
    //   contextId
    // } = this.state;

    // add controllers
    this.controllers.createComponent('PopperController');
  }
}

export default AsyncNode;