import RuntimeDataProvider from '../RuntimeDataProvider';
import DataDependencyGraph from './DataDependencyGraph';

export default class DDGSet {
  /**
   * @type {DataDependencyGraph[]}
   */
  graphs;

  /**
   * 
   * @param {RuntimeDataProvider} dp 
   */
  constructor(dp) {
    this.dp = dp;
    this.clear();
  }

  makeGraphId(...inputs) {
    return `DDG (${inputs.join(',')})`;
  }

  getCreateDDGFailureReason({ applicationId, contextId }) {
    const graphId = this.makeGraphId(applicationId, contextId);
    if (!this.graphsById.get(graphId)) {
      const paramTraces = this.dp.util.getParamTracesOfContext(contextId);
      const returnArgumentInputDataNodeId = this.dp.util.getReturnArgumentInputDataNodeIdOfContext(contextId);

      if (!paramTraces.length) {
        return `Selected context (#${contextId}) did not have any (recorded) parameters.`;
      }
      if (!returnArgumentInputDataNodeId) {
        return `Selected context (#${contextId}) did not return anything.`;
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
  getOrCreateDDG(ddgArgs) {
    let { applicationId, contextId, watchTraceIds, returnTraceId } = ddgArgs;
    const graphId = this.makeGraphId(applicationId, contextId);
    if (!this.graphsById.get(graphId)) {
      if (!watchTraceIds) {
        watchTraceIds = [];
        const paramTraces = this.dp.util.getParamTracesOfContext(contextId);
        const returnArgumentInputDataNodeId = this.dp.util.getReturnArgumentInputDataNodeIdOfContext(contextId);

        if (!returnArgumentInputDataNodeId || !returnArgumentInputDataNodeId) {
          return null;
        }

        for (const trace of paramTraces) {
          if (trace) {
            // const dataNode = this.dp.util.getDataNodeOfTrace(trace.traceId);
            // if (dataNode) {
            watchTraceIds.push(trace.traceId);
            // }
          }
        }
        returnTraceId = this.dp.util.getTraceOfDataNode(returnArgumentInputDataNodeId).traceId;
        watchTraceIds.push(returnTraceId);
      }

      this.newDataDependencyGraph(graphId, { watchTraceIds, returnTraceId });
    }
    return this.graphsById.get(graphId);
  }

  newDataDependencyGraph(graphId, watched) {
    const graph = new DataDependencyGraph(this.dp, graphId);
    graph.build(watched);
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
