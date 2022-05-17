// import minBy from 'lodash/minBy';
// import maxBy from 'lodash/maxBy';
import first from 'lodash/first';
import last from 'lodash/last';
import find from 'lodash/find';
import findLast from 'lodash/findLast';

/** @typedef { import("./DataDependencyGraph").default } DataDependencyGraph */

export default class DDGBounds {
  minNodeId;
  maxNodeId;

  minTraceId;
  maxTraceId;

  minContextId;
  maxContextId;

  /**
   * @param {DataDependencyGraph} ddg
   * @param {number[]} watchTraceIds
   */
  constructor(ddg, watchTraceIds) {
    this.ddg = ddg;
    this.watchedTraceIds = watchTraceIds.sort((a, b) => a - b);

    const { dp } = this;

    this.minTraceId = first(watchTraceIds);
    this.maxTraceId = last(watchTraceIds);

    const firstDataTraceId = find(watchTraceIds, traceId => dp.util.getDataNodesOfTrace(traceId)?.length);
    const lastDataTraceId = findLast(watchTraceIds, traceId => dp.util.getDataNodesOfTrace(traceId)?.length);
    this.minNodeId = first(dp.util.getDataNodesOfTrace(firstDataTraceId))?.nodeId;
    this.maxNodeId = last(dp.util.getDataNodesOfTrace(lastDataTraceId))?.nodeId;

    this.minContextId = dp.util.getTraceContext(this.minTraceId).contextId;
    this.maxContextId = dp.util.getTraceContext(this.maxTraceId).contextId;
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

  containsContext(contextId) {
    return contextId >= this.minContextId && contextId <= this.maxContextId;
  }
}
