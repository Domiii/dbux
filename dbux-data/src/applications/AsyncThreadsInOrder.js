import AsyncNode from '@dbux/common/src/types/AsyncNode';
import { mergeSortedArray } from '@dbux/common/src/util/arrayUtil';

/** @typedef {import('./ApplicationSetData').default} ApplicationSetData */

export default class AsyncThreadsInOrder {
  /**
   * @param {ApplicationSetData} applicationSetData 
   */
  constructor(applicationSetData) {
    this.applicationSetData = applicationSetData;
    /**
     * @type {AsyncNode[]}
     */
    this._all = [];
    /**
     * @type {Map<string, number>}
     */
    this.threadIndexByKey = new Map();
  }

  get applicationSet() {
    return this.applicationSetData.set;
  }

  refresh() {
    const applications = this.applicationSet.getAll();
    const allThreads = applications.map((app) => {
      const { dataProvider: dp, applicationId } = app;
      const threadIds = dp.indexes.asyncNodes.byThread.getAllKeys();
      return threadIds.map(threadId => {
        const firstNode = dp.indexes.asyncNodes.byThread.getFirst(threadId);
        const { createdAt } = dp.collections.executionContexts.getById(firstNode.rootContextId);
        return {
          applicationId,
          threadId,
          createdAt
        };
      });
    });

    this._all = mergeSortedArray(allThreads, node => node.createdAt);

    this.threadIndexByKey.clear();

    for (let i = 0; i < this._all.length; ++i) {
      const node = this._all[i];
      this.threadIndexByKey.set(this._makeKey(node), i);
    }
  }

  _handleApplicationsChanged = () => {
    const applications = this.applicationSet.getAll();
    this.refresh();

    for (const app of applications) {
      this.applicationSet.subscribe(
        app.dataProvider.onData('asyncEventUpdates', this._handleNewAsyncNode)
      );
    }
  }

  _handleNewAsyncNode = (/* app, contexts */) => {
    // TODO: [performance] can we incrementally add new data only?
    this.refresh();
  }

  _makeKey({ threadId, applicationId }) {
    return `${applicationId}_${threadId}`;
  }

  // ###########################################################################
  // public
  // ###########################################################################

  getAll() {
    return this._all;
  }

  getIndex(asyncNode) {
    const key = this._makeKey(asyncNode);
    const index = this.threadIndexByKey.get(key);
    if (index === undefined) {
      throw new Error(`AsyncNode not included. asyncNode: ${JSON.stringify(asyncNode)}`);
    }
    return index;
  }
}
