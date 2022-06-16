import pull from 'lodash/pull';
import { throttle } from '@dbux/common/src/util/scheduling';
import NanoEvents from 'nanoevents';
import RuntimeDataProvider from '../RuntimeDataProvider';
import DataDependencyGraph from './DataDependencyGraph';

export default class DDGSet {
  /**
   * @type {DataDependencyGraph[]}
   */
  ddgs;

  /**
   * 
   * @param {RuntimeDataProvider} dp 
   */
  constructor(dp) {
    this.dp = dp;
    this.clear();
  }

  getAll() {
    return this.ddgs;
  }

  contains(ddg) {
    return this.ddgs.includes(ddg);
  }

  #makeGraphId(...inputs) {
    return `DDG (${inputs.join(',')})`;
  }

  getCreateDDGFailureReason({ applicationId, contextId }) {
    const graphId = this.#makeGraphId(applicationId, contextId);
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

  /**
   * @returns {DataDependencyGraph}
   */
  getOrCreateDDG(ddgArgs) {
    let { applicationId, contextId, watchTraceIds, returnTraceId } = ddgArgs;
    const graphId = this.#makeGraphId(applicationId, contextId);
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
    const graph = new DataDependencyGraph(this, graphId);
    graph.build(watched);
    this.#add(graphId, graph);
    return graph;
  }

  /**
   * @param {DataDependencyGraph} graph 
   */
  #add(graphId, graph) {
    graph.id = graphId;
    this.graphsById.set(graphId, graph);
    this.ddgs.push(graph);

    this.#notifyChanged();
  }

  /**
   * 
   * @param {DataDependencyGraph} ddg 
   */
  remove(ddg) {
    this.graphsById.delete(ddg.graphId);
    pull(this.ddgs, ddg);

    this.#notifyChanged();
  }

  clear() {
    this.ddgs = [];
    this.graphsById = new Map();

    this.#notifyChanged();
  }

  /** ###########################################################################
   * events + subscriptions
   * ######################################################################### */

  #emitter = new NanoEvents();

  /**
   */
  onSetChanged(cb) {
    const unsubscribe = this.#emitter.on('setChanged', cb);
    return unsubscribe;
  }

  #notifyChanged() {
    // this.#unsubscribeAll();
    this.#emitter.emit('setChanged', this.ddgs);
  }

  _notifyUpdate = throttle((ddg) => {
    this.#emitter.emit('graph-update', ddg);
  });

  onGraphUpdate(cb) {
    return this.#emitter.on('graph-update', cb);
  }

  // #unsubscribeCallbacks = [];
  // subscribe(...unsubscribeCallbacks) {
  //   this.#unsubscribeCallbacks.push(...unsubscribeCallbacks);
  // }
  // /**
  //  * Stop listening on all events subscribed to with subscribe.
  //  */
  // #unsubscribeAll() {
  //   this.#unsubscribeCallbacks.forEach(unsubscribe => unsubscribe());
  //   this.#unsubscribeCallbacks = [];
  // }
}
