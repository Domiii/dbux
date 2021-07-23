import AsyncNode from '@dbux/common/src/types/AsyncNode';
import { mergeSortedArray } from '@dbux/common/src/util/arrayUtil';

/** @typedef {import('./ApplicationSetData').default} ApplicationSetData */

export default class AsyncNodesInOrder {
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
    this._nodeIndexByKey = new Map();
  }

  get applicationSet() {
    return this.applicationSetData.set;
  }

  refresh() {
    const applications = this.applicationSet.getAll();
    const allAsyncNodes = applications.map((app) => app.dataProvider.collections.asyncNodes.getAllActual());

    this._all = mergeSortedArray(allAsyncNodes, (node) => {
      const dp = this.applicationSet.getById(node.applicationId).dataProvider;
      const rootContext = dp.collections.executionContexts.getById(node.rootContextId);
      return rootContext.createdAt;
    });

    this._nodeIndexByKey.clear();

    for (let i = 0; i < this._all; ++i) {
      const node = this._all[i];
      this._nodeIndexByKey.set(this._makeKey(node), i);
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

  _makeKey({ asyncNodeId, applicationId }) {
    return `${applicationId}_${asyncNodeId}`;
  }

  // ###########################################################################
  // public
  // ###########################################################################

  getAll() {
    return this._all;
  }

  getIndex(node) {
    const key = this._makeKey(node);
    const index = this._nodeIndexByKey.get(key);
    if (index === undefined) {
      throw new Error(`AsyncNode not included. asyncNode: ${JSON.stringify(node)}`);
    }
    return index;
  }
}
