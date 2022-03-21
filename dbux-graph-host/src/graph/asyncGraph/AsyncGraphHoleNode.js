import allApplications from '@dbux/data/src/applications/allApplications';

/** @typedef {import('./AsyncGraphNode').default} AsyncGraphNode */
/** @typedef {import('@dbux/common/src/types/AsyncNode').default} AsyncNode */

export default class AsyncGraphHoleNode {
  /**
   * @param {AsyncNode[]} asyncNodes 
   * @param {AsyncNode[]} frontier
   * @param {AsyncGraphNode | null} parent
   */
  constructor(asyncNodes, frontier, parent, parentEdgeType) {
    this.isHole = true;
    this.asyncNodes = asyncNodes;
    this.frontier = frontier;
    this.parent = parent;
    this.parentEdgeType = parentEdgeType;
  }

  get asyncNode() {
    return this.asyncNodes[0];
  }

  serialize() {
    const { asyncNode } = this;
    const { applicationId, rootContextId } = asyncNode;
    const dp = allApplications.getById(applicationId).dataProvider;
    const displayName = `(hidden: ${this.asyncNodes.length})`;
    const locLabel = '';
    const syncInCount = 0;
    const syncOutCount = 0;
    const parentEdges = [];
    const { parentEdgeType } = this;
    const parentAsyncNodeId = this.parent?.asyncNode.asyncNodeId;
    const isProgramRoot = dp.util.isContextProgramContext(rootContextId);
    const realStaticContextid = dp.util.getRealContextOfContext(rootContextId).staticContextId;
    const packageName = dp.util.getContextPackageName(rootContextId);
    const postAsyncEventUpdate = dp.util.getAsyncPostEventUpdateOfRoot(rootContextId);
    const postAsyncEventUpdateType = postAsyncEventUpdate?.type;
    const stats = this.getStats();

    return {
      asyncNode,
      // executionContext,

      displayName,
      locLabel,
      syncInCount,
      syncOutCount,
      parentEdges,
      parentEdgeType,
      parentAsyncNodeId,
      // nestingDepth,

      isProgramRoot,
      realStaticContextid,
      packageName,
      postAsyncEventUpdateType,
      stats,

      /**
       * dummy value, will be resolve later in `resolveErrorData`
       */
      hasError: false,
    };
  }

  getStats() {
    const { applicationId } = this.asyncNode;
    const dp = allApplications.getById(applicationId).dataProvider;
    const contextIds = this.asyncNodes.map(_asyncNode => _asyncNode.rootContextId);
    const stats = dp.queryImpl.statsByContext.getCombinedStats(contextIds);
    return {
      nTreeFileCalled: stats.nTreeFileCalled,
      nTreeStaticContexts: stats.nTreeStaticContexts,
      nTreeContexts: stats.nTreeContexts,
      nTreeTraces: stats.nTreeTraces,
      nTreePackages: stats.nTreePackages,
    };
  }
}