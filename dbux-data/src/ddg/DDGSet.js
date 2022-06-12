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
      const returnArgumentTrace = this.dp.util.getReturnArgumentTraceOfContext(contextId);

      if (!paramTraces.length) {
        return `Selected context (#${contextId}) did not have any (recorded) parameters.`;
      }
      if (!returnArgumentTrace) {
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
        const returnArgumentTrace = this.dp.util.getReturnArgumentTraceOfContext(contextId);

        if (!returnArgumentTrace) {
          return null;
        }

        // take input of ReturnArgument instead (to avoid some really nasty small issues)
        const returnNode = this.dp.util.getDataNode(returnArgumentTrace.nodeId);
        const returnInputTrace = this.dp.util.getDataNode(returnNode.inputs?.[0]);
        if (!returnInputTrace) {
          return null;
        }

        for (const trace of [...paramTraces, returnInputTrace]) {
          if (trace) {
            // const dataNode = this.dp.util.getDataNodeOfTrace(trace.traceId);
            // if (dataNode) {
            watchTraceIds.push(trace.traceId);
            // }
          }
        }
        returnTraceId = returnInputTrace.traceId;
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
