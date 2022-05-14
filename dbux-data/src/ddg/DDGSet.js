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
    this.graphsById = new Map();
  }

  makeGraphId(...inputs) {
    return `DDG #by#${inputs.join(',')}`;
  }

  getCreateDDGFailureReason({ contextId }) {
    const graphId = this.makeGraphId(contextId);
    if (!this.graphsById.get(graphId)) {
      const paramTraces = this.dp.util.getParamTracesOfContext(contextId);
      const returnArgumentTrace = this.dp.util.getReturnArgumentTraceOfContext(contextId);

      if (!paramTraces.length) {
        return 'Selected context did not have any (recorded) parameters.';
      }
      if (!returnArgumentTrace) {
        return 'Selected context did not return anything.';
      }
    }
    return null;
  }

  /**
   * @returns {DataDependencyGraph}
   */
  getOrCreateDDGForContext({ contextId }) {
    const graphId = this.makeGraphId(contextId);
    if (!this.graphsById.get(graphId)) {
      const inputNodes = [];
      const paramTraces = this.dp.util.getParamTracesOfContext(contextId);
      const returnArgumentTrace = this.dp.util.getReturnArgumentTraceOfContext(contextId);

      if (!returnArgumentTrace) {
        return null;
      }

      for (const trace of [...paramTraces, returnArgumentTrace]) {
        if (trace) {
          const dataNode = this.dp.util.getDataNodeOfTrace(trace.traceId);
          if (dataNode) {
            inputNodes.push(dataNode);
          }
        }
      }

      this.newDataDependencyGraph(graphId, inputNodes);
    }
    return this.graphsById.get(graphId);
  }

  newDataDependencyGraph(graphId, inputNodes) {
    const graph = new DataDependencyGraph(this.dp, graphId);
    graph.build(inputNodes);
    this._add(graphId, graph);
    return graph;
  }

  /**
   * @param {DataDependencyGraph} graph 
   */
  _add(graphId, graph) {
    graph.id = graphId;
    this.graphsById.set(graphId, graph);
    this.graphs.push(graph);
  }
}
