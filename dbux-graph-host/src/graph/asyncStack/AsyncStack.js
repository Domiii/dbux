import SyncGraphBase from '../SyncGraphBase';

/** @typedef {import('@dbux/data/src/applications/Application').default} Application */

class AsyncStack extends SyncGraphBase {
  init() {
    super.init();

    this.refresh();
  }

  shouldBeEnabled() {
    if (this.context.graphDocument.toolbar.state.stackEnabled) {
      return true;
    }
    else {
      return false;
    }
  }
}

export default AsyncStack;