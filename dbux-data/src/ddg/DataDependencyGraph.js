/** @typedef {import('../RuntimeDataProvider').default} RuntimeDataProvider */
/** @typedef { import('@dbux/common/src/types/constants/DataNodeType').default } DataNodeType */
/** @typedef { import('@dbux/common/src/types/constants/DataNodeType').DataNodeTypeValue } DataNodeTypeValue */


// import DDGTimeline from './DDGTimeline';
import DataNodeType from '@dbux/common/src/types/constants/DataNodeType';
import DDGWatchSet from './DDGWatchSet';
import DDGBounds from './DDGBounds';
import DDGEdge from './DDGEdge';
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

  /** ########################################
   * render data
   *  ######################################*/

  /**
   * @type {DDGTimelineNode}
   */
  timelineRoot;

  /**
   * NOTE: {@link DDGTimelineNode#timelineId} indexes this array.
   * @type {DDGTimelineNode[]}
   */
  timelineNodes = [null];

  /**
   * NOTE: {@link BaseDataTimelineNode#dataTimelineId} indexes this array.
   * @type {DataTimelineNode[]}
   */
  timelineDataNodes = [null];

  /**
   * NOTE: 
   * @type {DDGEdge[]}
   */
  edges = [null];

  /**
   * @type {Map.<number, DDGEdge[]>}
   */
  outEdgesByDataTimelineId;

  /**
   * @type {Map.<number, DDGEdge[]>}
   */
  inEdgesByDataTimelineId;


  getRenderData() {
    const {
      timelineRoot,
      timelineNodes,
      timelineDataNodes,
      edges
    } = this;
    return {
      timelineRoot,
      timelineNodes,
      timelineDataNodes,
      edges
    };
  }


  /** ###########################################################################
   * ctor
   * ##########################################################################*/


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
    
    this.edges = [null];
    this.inEdgesByDataTimelineId = new Map();
    this.outEdgesByDataTimelineId = new Map();

    /** ########################################
     * phase 1: build timeline nodes and edges
     * #######################################*/


    const timelineBuilder = new DDGTimelineBuilder(this);

    for (let traceId = bounds.minTraceId; traceId <= bounds.maxTraceId; ++traceId) {
      // update control group stack
      timelineBuilder.updateStack(traceId);

      // add nodes and edges of trace
      timelineBuilder.addTraceToTimeline(traceId);
    }


    /** ########################################
     * phase 2: 
     *  1. use edges to gather connectivity data for nodes
     *  2. general post-processing
     *  ######################################*/

    for (const node of this.timelineDataNodes) {
      if (!node) {
        continue;
      }
      const nIncomingEdges = this.inEdgesByDataTimelineId.get(node.dataTimelineId)?.length || 0;
      const nOutgoingEdges = this.outEdgesByDataTimelineId.get(node.dataTimelineId)?.length || 0;

      node.watched = this.watchSet.isWatchedDataNode(node.dataNodeId);
      node.nInputs = nIncomingEdges;
      node.nOutputs = nOutgoingEdges;
    }
  }
}
