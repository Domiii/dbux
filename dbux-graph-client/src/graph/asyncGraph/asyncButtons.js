class AsyncButton {
  static label = '';
  static title = '';
  // eslint-disable-next-line no-unused-vars
  static isAvailable(nodeData) {
    throw new Error('abstract method not implemented');
  }

  // eslint-disable-next-line no-unused-vars
  static handleClick(asyncGraph, asyncNodeData) {
    throw new Error('abstract method not implemented');
  }
}

class ForkButton extends AsyncButton {
  static label = '🢄';
  static title = 'Go to fork parent';
  static isAvailable({ parentAsyncNodeId }) {
    if (parentAsyncNodeId) {
      return true;
    }
    return false;
  }

  static handleClick(asyncGraph, asyncNodeData) {
    const { applicationId } = asyncNodeData.asyncNode;
    const { parentAsyncNodeId } = asyncNodeData;
    if (parentAsyncNodeId) {
      asyncGraph.remote.gotoAsyncNode(applicationId, parentAsyncNodeId);
    }
  }
}

class SyncInButton extends AsyncButton {
  static label = '🡅';
  static title = 'Select sync in threads';
  static isAvailable({ syncInCount }) {
    if (syncInCount) {
      return true;
    }
    return false;
  }

  static handleClick(asyncGraph, asyncNodeData) {
    const { applicationId, asyncNodeId } = asyncNodeData.asyncNode;
    asyncGraph.remote.selectSyncInThreads(applicationId, asyncNodeId);
  }
}

class SyncOutButton extends AsyncButton {
  static label = '🡇';
  static title = 'Select sync out threads';
  static isAvailable({ syncOutCount }) {
    if (syncOutCount) {
      return true;
    }
    return false;
  }

  static handleClick(asyncGraph, asyncNodeData) {
    const { applicationId, asyncNodeId } = asyncNodeData.asyncNode;
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