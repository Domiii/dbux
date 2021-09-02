import SyncGraphBase from '../SyncGraphBase';

/** @typedef {import('@dbux/data/src/applications/Application').default} Application */

class AsyncStack extends SyncGraphBase {
  shouldBeEnabled() {
    if (this.context.graphDocument.state.stackEnabled) {
      return true;
    }
    else {
      return false;
    }
  }
}

export default AsyncStack;