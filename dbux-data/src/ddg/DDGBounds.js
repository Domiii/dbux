// import minBy from 'lodash/minBy';
// import maxBy from 'lodash/maxBy';
import first from 'lodash/first';
import last from 'lodash/last';
import find from 'lodash/find';
import findLast from 'lodash/findLast';
import EmptyArray from '@dbux/common/src/util/EmptyArray';

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
    this.watchedTraceIds = watchTraceIds.sort();

    const { dp } = this;

    this.minTraceId = first(watchTraceIds);
    this.maxTraceId = last(watchTraceIds);

    this.minNodeId = find(watchTraceIds, traceId => first(dp.util.getDataNodesOfTrace(traceId) || EmptyArray));
    this.maxNodeId = findLast(watchTraceIds, traceId => last(dp.util.getDataNodesOfTrace(traceId) || EmptyArray));

    this.minContextId = find(watchTraceIds, traceId => dp.util.getTraceContext(traceId));
    this.maxContextId = findLast(watchTraceIds, traceId => dp.util.getTraceContext(traceId));
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
