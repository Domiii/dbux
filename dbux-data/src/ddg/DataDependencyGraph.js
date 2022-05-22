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
   * @type {DDGEdge[]}
   */
  edges;

  /**
   * @type {Map.<number, DDGEdge[]>}
   */
  outEdgesByDataTimelineId;

  /**
   * @type {Map.<number, DDGEdge[]>}
   */
  inEdgesByDataTimelineId;


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

  _shouldSkipDataNode(dataNodeId) {
    if (this.dp.util.isDataNodePassAlong(dataNodeId)) {
      // skip all "pass along" nodes
      return true;
    }

    const trace = this.dp.util.getTraceOfDataNode(dataNodeId);
    if (trace) {
      if (isBeforeCallExpression(trace.type)) {
        // skip BCE
        return true;
      }
    }
    return false;
  }

  _addEdgeToMap(map, id, edge) {
    let edges = map.get(id);
    if (!edges) {
      map.set(id, edges = []);
    }
    edges.push(edge);
  }

  /**
   * @param {DataTimelineNode} fromNode 
   * @param {DataTimelineNode} toNode 
   */
  _addEdge(fromNode, toNode) {
    const newEdge = new DDGEdge(DDGEdgeType.Write, this.edges.length, fromNode.dataTimelineId, toNode.dataTimelineId);
    this.edges.push(newEdge);

    this._addEdgeToMap(this.inEdgesByDataTimelineId, toNode.dataTimelineId, newEdge);
    this._addEdgeToMap(this.outEdgesByDataTimelineId, fromNode.dataTimelineId, newEdge);
  }

  /**
   * @param {number[]} watchTraceIds 
   */
  build(watchTraceIds) {
    // this.selectedSet = inputNodes;
    this.watchSet = new DDGWatchSet(this, watchTraceIds);
    const { dp } = this;
    const bounds = this.bounds = new DDGBounds(this, watchTraceIds);

    this.inEdgesByDataTimelineId = new Map();
    this.outEdgesByDataTimelineId = new Map();

    const nodesByDataNodeId = [];
    const edgesByFromDataNodeId = [];

    /** ########################################
     * phase 1: gather potential nodes and edges
     * NOTE: we take this extra step to assure properties of a sparse timeline:
     *   a) don't allocate unwanted nodes
     *   b) keep timeline ordering (order by `dataNodeId`)
     * #######################################*/

    for (let traceId = bounds.minTraceId; traceId <= bounds.maxTraceId; ++traceId) {
      for (const dataNode of dp.util.getDataNodesOfTrace(traceId)) {
        // const dataNodeId = dataNode.nodeId;
        if (dataNode.inputs) { // only add nodes with connectivity
          const fromDataNodeIdsSet = new Set();  // don't add duplicate edges
          for (const fromDataNodeId of dataNode.inputs) {
            if (!bounds.containsNode(fromDataNodeId)) {
              // TODO: handle external nodes
            }
            else {
              let fromDataNode = dp.util.getDataNode(fromDataNodeId);
              if (fromDataNode.refId) {
                throw new Error('TODO: fix `valueFromId` for reference types');
              }

              // merge computations
              while (this._shouldSkipDataNode(fromDataNode.nodeId)) {
                const valueFromNode = dp.util.getDataNode(fromDataNode.valueFromId);
                if (!valueFromNode) {
                  // end of the line
                  break;
                }
                if (!bounds.containsNode(valueFromNode.nodeId)) {
                  // TODO: handle external nodes
                  break;
                }
                fromDataNode = valueFromNode;
              }

              if (!fromDataNodeIdsSet.has(fromDataNode.nodeId)) {
                fromDataNodeIdsSet.add(fromDataNode.nodeId);

                nodesByDataNodeId[dataNode.nodeId] = true;
                nodesByDataNodeId[fromDataNode.nodeId] = true;

                edgesByFromDataNodeId[fromDataNode.nodeId] = edgesByFromDataNodeId[fromDataNode.nodeId] || [];
                edgesByFromDataNodeId[fromDataNode.nodeId].push(dataNode.nodeId);
              }
              else {
                // → this edge has already been registered, meaning there are multiple connections between exactly these two nodes
                // TODO: make it a GroupEdge with `writeCount` and `controlCount` instead?
                // TODO: add summarization logic
              }
            }
          }
        }
      }
    }


    /** ########################################
     * phase 2: build timelines (create nodes)
     * #######################################*/

    this.edges = [null];

    const timelineBuilder = new DDGTimelineBuilder();

    for (let traceId = bounds.minTraceId; traceId <= bounds.maxTraceId; ++traceId) {
      timelineBuilder.visitTrace(traceId);

      for (const dataNode of dp.util.getDataNodesOfTrace(traceId)) {
        const dataNodeId = dataNode.nodeId;
        if (nodesByDataNodeId[dataNodeId]) {
          // timelineBuilder.addDataNodes(dataNodeId);
          timelineBuilder.addTimelineDataNodes(traceId);
          break;
        }
      }
    }


    /** ########################################
     * phase 3: create edges
     * #######################################*/


    TODO
    // TODO: `dataNodeId` does not uniquely identify a timeline node!!!

    for (const fromDataNodeId of nodesByDataNodeId) {
      if (!fromDataNodeId) {
        continue;
      }

      const fromNode = timelineBuilder.getDataTimelineNodeByDataNodeId(fromDataNodeId);
      const toNodeIds = edgesByFromDataNodeId[fromDataNodeId];
      for (const toDataNodeId of toNodeIds) {
        const toNode = timelineBuilder.getDataTimelineNodeByDataNodeId(toDataNodeId);
        this._addEdge(fromNode, toNode);
      }
    }


    /** ########################################
     * phase 4: use edges to gather connectivity data for nodes and general post-processing
     *  ######################################*/

    for (const node of timelineBuilder.timelineDataNodes) {
      const nIncomingEdges = this.inEdgesByDataTimelineId.get(node.dataTimelineId)?.length || 0;
      const nOutgoingEdges = this.outEdgesByDataTimelineId.get(node.dataTimelineId)?.length || 0;

      node.watched = this.ddg.watchSet.isWatchedDataNode(node.dataNode.nodeId);
      node.nInputs = nIncomingEdges;
      node.nOutputs = nOutgoingEdges;
    }
  }
}
