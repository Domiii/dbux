/** @typedef {import('@dbux/common/src/types/DataNode').default} DataNode */
/** @typedef {import('./DataDependencyGraph').default} DataDependencyGraph */

/**
 * @deprecated
 */
export default class DDGSelectedSet {
  /**
   * actual roots in selected set
   * @type {Set<number>}
   */
  selectedSetRoots;

  /**
   * all individual DataNodes in all `selectedSetRoot` trees
   * @type {Set<number>}
   */
  selectedSet;

  /**
   * 
   * @param {DataDependencyGraph} ddg 
   * @param {DataNode[]} inputNodes NOTE: input set is actually a set of trees of DataNodes
   */
  constructor(ddg, inputNodes) {
    this.ddg = ddg;
    this.selectedSetRoots = new Set();
    this.selectedSet = [];

    const visited = new Set();
    for (const inputNode of inputNodes) {
      this.addSelectedSet(null, inputNode, visited);
    }
  }

  get dp() {
    return this.ddg.dp;
  }

  /**
   * 
   * @param {DataNode} parent 
   * @param {DataNode} node 
   * @param {Set<DataNode>} visited 
   */
  addSelectedSet(parent, node, visited) {
    const { nodeId } = node;
    if (visited.has(node)) {
      if (parent) {
        // remove non-root input nodes
        this.selectedSetRoots.delete(nodeId);
      }
      return;
    }
    else {
      visited.add(node);
    }

    if (!parent) {
      this.selectedSetRoots.add(node.nodeId);
    }

    // TODO: keep track of path-to-root in `selectedSet`
    this.selectedSet.push({ parent: parent.nodeId, to: nodeId });

    // make sure to add all children recursively (e.g. in case of array or object)
    // TODO-M: find out the actual children to traverse (use algorithm similar to `constructValueFull`)
    let children;
    const { refId } = node;
    if (refId) {
      children = this.dp.util.constructValueObjectShallow(refId, nodeId);
    }
    else {
      children = [node];
    }
    for (const child of children) {
      this.addSelectedSet(node, child, visited);
    }
  }

  /**
   * If given `dataNode` refers to a memory location that is in `selectedSet`:
   * find its root and produce a unique id combining root id + the id of the path from that root to itself.
   */
  getSelectedSetGroupId(dataNode) {
    const root = this.getDataNodeRoot(dataNode);
    if (!root) {
      return null;
    }

    const path = this.getDataNodePathToRoot(dataNode);
    const rootStaticTraceId = this.dp.util.getStaticTrace(root.traceId);

    return `${rootStaticTraceId}#${path})`;
  }

  getDataNodePathToRoot(dataNode) {
    // TODO-M: use `varAccess.property`?
  }

  getDataNodeRoot(dataNode) {
    // TODO-M: apply `disjoint set union` data structure?
  }
}
