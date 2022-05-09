/** @typedef {import('./DataDependencyGraph').default} DataDependencyGraph */

import DataDependencyGraph from './DataDependencyGraph';

export default class DDGSet {
  /**
   * @type {DataDependencyGraph[]}
   */
  graphs;

  constructor(dp) {
    this.dp = dp;
    this.graphs = [];
  }

  newDataDependencyGraph(inputNodes) {
    const graph = new DataDependencyGraph(this.dp);
    graph.build(inputNodes);
    this._add(graph);
    return graph;
  }

  /**
   * @param {DataDependencyGraph} graph 
   */
  _add(graph) {
    graph.id = this.graphs.length;
    this.graphs.push(graph);
  }
}
