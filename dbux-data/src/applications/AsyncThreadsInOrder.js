import AsyncNode from '@dbux/common/src/types/AsyncNode';
import { mergeSortedArray } from '@dbux/common/src/util/arrayUtil';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { newLogger } from '@dbux/common/src/log/logger';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('AsyncThreadsInOrder');


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
      let threadIds = dp.indexes.asyncNodes.byThread.getAllKeys();

      // filter seleted threads
      const { threadSelection } = this.applicationSetData;
      if (threadSelection.isActive()) {
        threadIds = threadIds.filter(threadId => threadSelection.isSelected(applicationId, threadId));
      }

      return threadIds.map(threadId => {
        const firstNode = dp.indexes.asyncNodes.byThread.getFirst(threadId);
        const context = dp.collections.executionContexts.getById(firstNode.rootContextId);
        if (!context) {
          warn(`Could not find context with cid=${firstNode.rootContextId} of firstNode=${JSON.stringify(firstNode)} of trace="${dp.util.makeTraceInfo(firstNode.traceId)}"`);
        }
        const { createdAt } = context || EmptyObject;
        return {
          applicationId,
          threadId,
          createdAt
        };
      });
    });

    this._all = [null, ...mergeSortedArray(allThreads, node => node.createdAt)];

    this.threadIndexByKey.clear();

    for (let i = 1; i < this._all.length; ++i) {
      const node = this._all[i];
      this.threadIndexByKey.set(this._makeKey(node), i);
    }
  }

  _handleApplicationsChanged = () => {
    const applications = this.applicationSet.getAll();
    this.refresh();

    for (const app of applications) {
      this.applicationSet.subscribe(
        app.dataProvider.onData('asyncNodes', this._handleNewAsyncNode)
      );
    }
  }

  _handleThreadSelectionChanged = () => {
    this.refresh();
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
    return index || null;
  }

  getIndexNotNull(node) {
    const index = this.getIndex(node);
    if (!index) {
      throw new Error(`AsyncNode has no thread. asyncNode: ${JSON.stringify(node)}`);
    }
    return index;
  }
}
