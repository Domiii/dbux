/** @typedef {import('../RuntimeDataProvider').default} RuntimeDataProvider */
/** @typedef { import('@dbux/common/src/types/constants/DataNodeType').default } DataNodeType */
/** @typedef { import('@dbux/common/src/types/constants/DataNodeType').DataNodeTypeValue } DataNodeTypeValue */


// import DDGTimeline from './DDGTimeline';
import DataNodeType from '@dbux/common/src/types/constants/DataNodeType';
import TraceType, { isBeforeCallExpression } from '@dbux/common/src/types/constants/TraceType';
import DDGWatchSet from './DDGWatchSet';
import DDGBounds from './DDGBounds';
import DDGEdge from './DDGEdge';
import DDGEdgeType from './DDGEdgeType';
import DDGTimelineBuilder from './DDGTimelineBuilder';
import { DataTimelineNode } from './DDGTimelineNodes';

export default class DataDependencyGraph {
  /**
   * @type {string}
   */
  id;

  /**
   * @type {RuntimeDataProvider}
   */
  dp;

  /**
   * @type {DDGWatchSet}
   */
  watchSet;

  /**
   * @type {DDGBounds}
   */
  bounds;


  /**
   * 
   * @param {RuntimeDataProvider} dp 
   */
  constructor(dp, graphId) {
    this.dp = dp;
    this.graphId = graphId;
  }

  /** ###########################################################################
   * Node + Edge getters
   * ##########################################################################*/


  /** ###########################################################################
   * {@link #build}
   * ##########################################################################*/

  /**
   * @param {number[]} watchTraceIds 
   */
  build(watchTraceIds) {
    // this.selectedSet = inputNodes;
    this.watchSet = new DDGWatchSet(this, watchTraceIds);
    const bounds = this.bounds = new DDGBounds(this, watchTraceIds);


    /** ########################################
     * phase 1: build timeline nodes and edges
     * #######################################*/

    this.edges = [null];

    const timelineBuilder = new DDGTimelineBuilder();

    for (let traceId = bounds.minTraceId; traceId <= bounds.maxTraceId; ++traceId) {
      timelineBuilder.updateStack(traceId);

      // timelineBuilder.addDataNodes(dataNodeId);

      // add nodes and edges of trace
      timelineBuilder.addTraceToTimeline(traceId);
    }


    /** ########################################
     * phase 2: 
     *  1. use edges to gather connectivity data for nodes
     *  2. general post-processing
     *  ######################################*/

    for (const node of timelineBuilder.timelineDataNodes) {
      const nIncomingEdges = this.inEdgesByDataTimelineId.get(node.dataTimelineId)?.length || 0;
      const nOutgoingEdges = this.outEdgesByDataTimelineId.get(node.dataTimelineId)?.length || 0;

      node.watched = this.ddg.watchSet.isWatchedDataNode(node.dataNodeId);
      node.nInputs = nIncomingEdges;
      node.nOutputs = nOutgoingEdges;
    }
  }
}
