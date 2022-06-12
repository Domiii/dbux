// import minBy from 'lodash/minBy';
// import maxBy from 'lodash/maxBy';
import first from 'lodash/first';
import last from 'lodash/last';
import find from 'lodash/find';
import findLast from 'lodash/findLast';

/** @typedef { import("./BaseDDG").default } BaseDDG */

export default class DDGBounds {
  minNodeId;
  maxNodeId;

  minTraceId;
  maxTraceId;

  // minContextId;
  // maxContextId;

  /**
   * @param {BaseDDG} ddg
   * @param {number[]} watchTraceIds
   */
  constructor(ddg) {
    this.ddg = ddg;
    const { watchTraceIds } = ddg.watchSet;
    this.watchedTraceIds = watchTraceIds.sort((a, b) => a - b);

    const { dp } = this;

    const firstTrace = dp.util.getTrace(watchTraceIds[0]);
    const contextId = this.rootContextId = firstTrace.contextId;
    const contextTraces = dp.util.getTracesOfContext(contextId);

    // this.minContextId = dp.util.getTraceContext(this.minTraceId).contextId;
    // this.maxContextId = dp.util.getTraceContext(this.maxTraceId).contextId; // TODO: this is wrong

    // NOTE: we do it this way to avoid omitting in-context traces (e.g. initial values of parameters)
    const firstDataTraceId = find(
      contextTraces,
      ({ traceId }) => dp.util.getDataNodesOfTrace(traceId)?.length
    ).traceId;
    const lastDataTraceId = findLast(
      contextTraces,
      ({ traceId }) => dp.util.getDataNodesOfTrace(traceId)?.length
    ).traceId;
    this.minTraceId = firstDataTraceId;
    this.maxTraceId = lastDataTraceId;

    if (this.maxTraceId < last(this.watchedTraceIds)) {
      // future-work: allow different trace selection methods, not limited to a single context
      throw new Error(`DDG currently does not support cross-context watching. All watched traces must have a single ancestor context.`);
    }

    this.minNodeId = first(dp.util.getDataNodesOfTrace(firstDataTraceId))?.nodeId;
    this.maxNodeId = last(dp.util.getDataNodesOfTrace(lastDataTraceId))?.nodeId;
  }

  get valid() {
    return !!this.minNodeId && !!this.maxNodeId;
  }

  get dp() {
    return this.ddg.dp;
  }

  containsNode(nodeId) {
    return nodeId >= this.minNodeId && nodeId <= this.maxNodeId;
  }

  containsTrace(traceId) {
    return traceId >= this.minTraceId && traceId <= this.maxTraceId;
  }

  // containsContext(contextId) {
  //   return contextId >= this.minContextId && contextId <= this.maxContextId;
  // }
}
