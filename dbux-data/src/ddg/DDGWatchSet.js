/** @typedef {import('@dbux/common/src/types/DataNode').default} DataNode */
/** @typedef {import('./DataDependencyGraph').default} DataDependencyGraph */

/**
 * 
 */
export default class DDGWatchSet {
  // /**
  //  * actual roots in selected set
  //  * @type {Set<number>}
  //  */
  // selectedSetRoots;

  // /**
  //  * all individual DataNodes in all `selectedSetRoot` trees
  //  * @type {Set<number>}
  //  */
  // selectedSet;
  /** @type {number[]} */
  watchTraceIds;
  /** @type {Set<number>} */
  watchTraceIdSet;
  /** @type {Set<number>} */
  watchStaticTraceIdSet;

  /**
   * @type {Set<number>}
   */
  staticTraceIdSet;
  /**
   * @type {Set<number>}
   */
  declarationTids;
  refIds;

  /**
   * @type {Map.<number, DDGSnapshotNode>}
   */
  snapshotsByDataNodeId = new Map();

  /**
   * 
   * @param {DataDependencyGraph} ddg 
   * @param {DataNode[]} inputNodes NOTE: input set is actually a set of trees of DataNodes
   */
  constructor(ddg, watchTraceIds) {
    this.ddg = ddg;

    const { dp } = this;

    this.watchTraceIdSet = new Set(watchTraceIds);
    this.watchTraceIds = Array.from(this.watchTraceIdSet);

    // get all watched declarationTids
    this.staticTraceIdSet = new Set(
      watchTraceIds.
        flatMap(watchTraceId => dp.util.getStaticTraceId(watchTraceId)).
        filter(Boolean)
    );
    this.declarationTids = new Set(
      Array.from(this.staticTraceIdSet).
        flatMap(staticTraceId => {
          const allDeclarationTids = dp.util.getTracesOfStaticTrace(staticTraceId).
            map(trace => {
              return dp.util.getTraceDeclarationTid(trace.traceId);
            });
          // filter(declarationTid => {
          //   if (!declarationTid) {
          //     return false;
          //   }
          //   // TODO: should we ignore `declarationTid`s if not declared in bounds?
          //   const contextId = getContextId(traceId);
          //   return this.bounds.containsContext(contextId);
          // });
          return allDeclarationTids;
        }).
        filter(Boolean)
    );

    // TODO: build ref Snapshots
    // const initialRefIds = makeUnique(
    //   watchTraceIds.
    //     flatMap(watchTraceId => getAllRefIds(watchTraceId)).
    //     filter(Boolean)
    // );

    // TODO: handle non-initial refs (e.g. `a = [[1, 2]]; a[0] = [3, 4]`)
    // this.refIds = initialRefIds
  }

  get dp() {
    return this.ddg.dp;
  }

  get bounds() {
    return this.ddg.bounds;
  }

  isWatchedDataNode(dataNodeId) {
    // const dataNode = this.dp.util.getDataNode(dataNodeId);
    const trace = this.dp.util.getTraceOfDataNode(dataNodeId);
    const { staticTraceId } = trace;
    if (this.staticTraceIdSet.has(staticTraceId)) {
      return true;
    }

    const declarationTid = this.dp.util.getDataNodeDeclarationTid(dataNodeId);
    if (this.declarationTids.has(declarationTid)) {
      return true;
    }

    // TODO: watched refs

    return false;
  }

  buildSnapshot(traceId) {
    const { dp } = this;

    const dataNodeId = dp.util.getLastDataNodeOfTrace(traceId);
    const initialState = dp.util.constructValueFull(dataNodeId);

    TODO

    return new DDGSnapshotNode(dataNodeId);
  }

  /**
   * @param {number} traceId
   */
  getOrCreateWatchedSnapshotNode(traceId) {
    // const dataNode = this.dp.util.getDataNode(dataNodeId);
    let snapshot = this.snapshotsByDataNodeId.get(traceId);
    if (!snapshot) {
      this.snapshotsByDataNodeId.set(traceId, snapshot = this.buildSnapshot(traceId));
    }
    return snapshot;
  }

  // /**
  //  * 
  //  * @param {DataNode} parent 
  //  * @param {DataNode} node 
  //  * @param {Set<DataNode>} visited 
  //  */
  // addSelectedSet(parent, node, visited) {
  //   const { nodeId } = node;
  //   if (visited.has(node)) {
  //     if (parent) {
  //       // remove non-root input nodes
  //       this.selectedSetRoots.delete(nodeId);
  //     }
  //     return;
  //   }
  //   else {
  //     visited.add(node);
  //   }

  //   if (!parent) {
  //     this.selectedSetRoots.add(node.nodeId);
  //   }

  //   // TODO: keep track of path-to-root in `selectedSet`
  //   this.selectedSet.push({ parent: parent.nodeId, to: nodeId });

  //   // make sure to add all children recursively (e.g. in case of array or object)
  //   // TODO-M: find out the actual children to traverse (use algorithm similar to `constructValueFull`)
  //   let children;
  //   const { refId } = node;
  //   if (refId) {
  //     children = this.dp.util.constructValueSnapshot(refId, nodeId);
  //   }
  //   else {
  //     children = [node];
  //   }
  //   for (const child of children) {
  //     this.addSelectedSet(node, child, visited);
  //   }
  // }

  // /**
  //  * If given `dataNode` refers to a memory location that is in `selectedSet`:
  //  * find its root and produce a unique id combining root id + the id of the path from that root to itself.
  //  */
  // getSelectedSetGroupId(dataNode) {
  //   const root = this.getDataNodeRoot(dataNode);
  //   if (!root) {
  //     return null;
  //   }

  //   const path = this.getDataNodePathToRoot(dataNode);
  //   const rootStaticTraceId = this.dp.util.getStaticTrace(root.traceId);

  //   return `${rootStaticTraceId}#${path})`;
  // }

  // getDataNodePathToRoot(dataNode) {
  //   // TODO-M: use `varAccess.property`?
  // }

  // getDataNodeRoot(dataNode) {
  //   // TODO-M: apply `disjoint set union` data structure?
  // }
}

