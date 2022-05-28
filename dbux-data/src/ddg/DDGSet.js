/** @typedef {import('./BaseDDG').default} DataDependencyGraph */

import DataDependencyGraph from './BaseDDG';

export default class DDGSet {
  /**
   * @type {DataDependencyGraph[]}
   */
  graphs;

  constructor(dp) {
    this.dp = dp;
    this.clear();
  }

  makeGraphId(...inputs) {
    return `DDG #by#${inputs.join(',')}`;
  }

  getCreateDDGFailureReason({ applicationId, contextId }) {
    const graphId = this.makeGraphId(applicationId, contextId);
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

  getAll() {
    return this.graphs;
  }

  /**
   * @returns {DataDependencyGraph}
   */
  getOrCreateDDGForContext({ applicationId, contextId }) {
    const graphId = this.makeGraphId(applicationId, contextId);
    if (!this.graphsById.get(graphId)) {
      const watchTraceIds = [];
      const paramTraces = this.dp.util.getParamTracesOfContext(contextId);
      const returnArgumentTrace = this.dp.util.getReturnArgumentTraceOfContext(contextId);

      if (!returnArgumentTrace) {
        return null;
      }

      for (const trace of [...paramTraces, returnArgumentTrace]) {
        if (trace) {
          // const dataNode = this.dp.util.getDataNodeOfTrace(trace.traceId);
          // if (dataNode) {
          watchTraceIds.push(trace.traceId);
          // }
        }
      }

      this.newDataDependencyGraph(graphId, watchTraceIds);
    }
    return this.graphsById.get(graphId);
  }

  newDataDependencyGraph(graphId, watchTraceIds) {
    const graph = new DataDependencyGraph(this.dp, graphId);
    graph.build(watchTraceIds);
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

  clear() {
    this.graphs = [];
    this.graphsById = new Map();
  }
}
