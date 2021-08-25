import HostComponentEndpoint from '../../componentLib/HostComponentEndpoint';

/** @typedef {import('@dbux/data/src/applications/Application').default} Application */

class AsyncStack extends HostComponentEndpoint {
  init() {
    this.graphRoot = this.children.createComponent('GraphRoot', {
      preferAsyncMode: true
    });
  }

  update() {
    this.graphRoot.updateRunNodes();
  }
}

export default AsyncStack;