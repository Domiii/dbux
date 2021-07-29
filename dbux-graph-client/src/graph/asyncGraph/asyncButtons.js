class AsyncButton {
  static label = '';
  // eslint-disable-next-line no-unused-vars
  static makeButtonData(nodeData) {
    throw new Error('abstract method not implemented');
  }

  // eslint-disable-next-line no-unused-vars
  static handleClick(asyncGraph, asyncNodeData, buttonData) {
    throw new Error('abstract method not implemented');
  }
}

class ForkButton extends AsyncButton {
  static label = '🢄';
  static makeButtonData({ parentAsyncNodeId }) {
    if (parentAsyncNodeId) {
      return { 'parent-async-node-id': parentAsyncNodeId };
    }
    return null;
  }

  static handleClick(asyncGraph, asyncNodeData, buttonData) {
    const { applicationId } = asyncNodeData;
    const { parentAsyncNodeId } = buttonData;
    if (parentAsyncNodeId) {
      asyncGraph.remote.gotoAsyncNode(applicationId, parentAsyncNodeId);
    }
  }
}

class SyncInButton extends AsyncButton {
  static label = '🡅';
  static makeButtonData({ syncInCount }) {
    if (syncInCount) {
      return { 'sync-in-count': syncInCount };
    }
    return null;
  }

  static handleClick(asyncGraph, asyncNodeData, buttonData) {
    const { applicationId, asyncNodeId } = asyncNodeData;
    asyncGraph.remote.selectSyncInThreads(applicationId, asyncNodeId);
  }
}

class SyncOutButton extends AsyncButton {
  static label = '🡇';
  static makeButtonData({ syncOutCount }) {
    if (syncOutCount) {
      return { 'sync-out-count': syncOutCount };
    }
    return null;
  }

  static handleClick(asyncGraph, asyncNodeData, buttonData) {
    const { applicationId, asyncNodeId } = asyncNodeData;
    asyncGraph.remote.selectSyncOutThreads(applicationId, asyncNodeId);
  }
}

/**
 * @type {AsyncButton[]}
 */
export const AsyncButtonClasses = {
  ForkButton,
  SyncInButton,
  SyncOutButton,
};