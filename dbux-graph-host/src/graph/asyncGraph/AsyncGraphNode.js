import EmptyArray from '@dbux/common/src/util/EmptyArray';
import allApplications from '@dbux/data/src/applications/allApplications';
import { makeContextLabel, makeContextLocLabel } from '@dbux/data/src/helpers/makeLabels';

/** @typedef {import('@dbux/common/src/types/AsyncNode').default} AsyncNode */
/** @typedef {import('./AsyncGraphHoleNode').default} AsyncGraphHoleNode */

/**
 * This represents a "node" in ACG, storing their related `AsyncNode` data
 */
export default class AsyncGraphNode {
  /**
   * @param {AsyncNode} asyncNode 
   * @param {AsyncGraphNode | AsyncGraphHoleNode} parent
   */
  constructor(asyncNode, parent, parentEdgeType) {
    this.isHole = false;
    this.asyncNode = asyncNode;
    this.parent = parent;
    this.parentEdgeType = parentEdgeType;
  }

  serialize() {
    const { asyncNode } = this;
    const { applicationId, rootContextId } = asyncNode;
    const app = allApplications.getById(applicationId);
    const dp = app.dataProvider;
    const executionContext = dp.collections.executionContexts.getById(rootContextId);
    const displayName = makeContextLabel(executionContext, app);
    const locLabel = makeContextLocLabel(applicationId, executionContext);
    const syncInCount = dp.indexes.asyncEvents.syncInByRoot.getSize(rootContextId);
    const syncOutCount = dp.indexes.asyncEvents.syncOutByRoot.getSize(rootContextId);

    const isProgramRoot = dp.util.isContextProgramContext(rootContextId);
    const realStaticContextid = dp.util.getRealContextOfContext(rootContextId).staticContextId;
    const packageName = dp.util.getContextPackageName(rootContextId);
    const postAsyncEventUpdate = dp.util.getAsyncPostEventUpdateOfRoot(rootContextId);
    const postAsyncEventUpdateType = postAsyncEventUpdate?.type;

    const parentEdges = (dp.indexes.asyncEvents.to.get(rootContextId) || EmptyArray)
      .map(edge => {
        const parentAsyncNode = dp.util.getAsyncNode(edge.fromRootContextId);
        return {
          edgeType: edge.edgeType,
          parentAsyncNodeId: parentAsyncNode.asyncNodeId
        };
      });
    // assuming all incoming edges of a node have same `edgeType`, so we can just take the first one
    const parentEdge = parentEdges[0];
    const parentEdgeType = parentEdge?.edgeType;
    const parentAsyncNodeId = parentEdge?.parentAsyncNodeId;
    const nestingDepth = dp.util.getNestedDepth(rootContextId);

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
      nestingDepth,

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
    const { applicationId, rootContextId } = this.asyncNode;
    const dp = allApplications.getById(applicationId).dataProvider;
    const stats = dp.queries.statsByContext(rootContextId);
    return {
      nTreeFileCalled: stats.nTreeFileCalled,
      nTreeStaticContexts: stats.nTreeStaticContexts,
      nTreeContexts: stats.nTreeContexts,
      nTreeTraces: stats.nTreeTraces,
      nTreePackages: stats.nTreePackages,
    };
  }
}