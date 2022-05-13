/** @typedef {import('../RuntimeDataProvider').default} RuntimeDataProvider */
/** @typedef {import('./DataDependencyGraph').default} DataDependencyGraph */


export default class DDGTimeline {
  /**
   * @param {DataDependencyGraph} ddg 
   */
  constructor(ddg, inputNodes) {
    this.ddg = ddg;
    this.build(inputNodes);
  }

  get dp() {
    return this.ddg.dp;
  }

  build(inputNodes) {
    // TODO: apply `DDGNode` and `DDGEdge` classes
    this.nodes = [];
    this.edges = [];


    for (let nodeId = minNodeId; nodeId <= maxNodeId; nodeId++) {
      const dataNode = this.dp.collections.dataNodes.getById(nodeId);
      this.nodes.push(dataNode);
      if (dataNode.inputs) {
        for (const inputNodeId of dataNode.inputs) {
          if (minNodeId <= inputNodeId && inputNodeId <= maxNodeId) {
            this.edges.push({ from: inputNodeId, to: nodeId });
          }
        }
      }
    }
  }
}
