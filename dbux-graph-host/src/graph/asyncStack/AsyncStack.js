import SyncGraphBase from '../SyncGraphBase';

/** @typedef {import('@dbux/data/src/applications/Application').default} Application */

class AsyncStack extends SyncGraphBase {
  init() {
    // TODO-M: new methods to create children
  }

  update() {
    // this.graphRoot.updateRunNodes();
  }

  handleRefresh() {
    this.logger.log('refreshed');
  }

  clear() {
    this.logger.log('cleared');
  }
}

export default AsyncStack;