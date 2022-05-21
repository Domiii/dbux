/** @typedef {import('../RuntimeDataProvider').default} RuntimeDataProvider */
/** @typedef { import('@dbux/common/src/types/constants/DataNodeType').default } DataNodeType */
/** @typedef { import('@dbux/common/src/types/constants/DataNodeType').DataNodeTypeValue } DataNodeTypeValue */


// import DDGTimeline from './DDGTimeline';
import DataNodeType from '@dbux/common/src/types/constants/DataNodeType';
import TraceType, { isBeforeCallExpression } from '@dbux/common/src/types/constants/TraceType';
import DDGWatchSet from './DDGWatchSet';
import DDGBounds from './DDGBounds';
import DDGEdge from './DDGEdge';
import DDGEntity from './DDGEntity';
import DDGEdgeType from './DDGEdgeType';
import DDGTimelineBuilder from './DDGTimelineBuilder';

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
   * @type {DDGEntity[]}
   */
  entitiesById;
  /**
   * @type {DDGNode[]}
   */
  nodes;
  /**
   * @type {DDGEdge[]}
   */
  edges;

  /**
   * @type {Map.<number, DDGNode>}
   */
  nodesByDataNodeId;

  /**
   * @type {Map.<number, DDGEdge[]>}
   */
  outEdgesByDDGNodeId;

  /**
   * @type {Map.<number, DDGEdge[]>}
   */
  inEdgesByDDGNodeId;


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
   * @param {DDGEntity} entity
   */
  _addEntity(entity) {
    const entityId = this.entitiesById.length + 1;
    entity.entityId = entityId;
    this.entitiesById[entityId] = entity;
  }

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
   * @param {DDGNode} fromDdgNode 
   * @param {DDGNode} toNode 
   */
  _addEdge(fromDdgNode, toNode) {
    const newEdge = new DDGEdge(DDGEdgeType.Write, fromDdgNode.ddgNodeId, toNode.ddgNodeId);

    this._addEntity(newEdge);
    this.edges.push(newEdge);

    this._addEdgeToMap(this.inEdgesByDDGNodeId, toNode.ddgNodeId, newEdge);
    this._addEdgeToMap(this.outEdgesByDDGNodeId, fromDdgNode.ddgNodeId, newEdge);
  }

  /**
   * @param {number[]} watchTraceIds 
   */
  build(watchTraceIds) {
    // this.selectedSet = inputNodes;
    this.watchSet = new DDGWatchSet(this, watchTraceIds);
    const { dp } = this;
    const bounds = this.bounds = new DDGBounds(this, watchTraceIds);

    this.entitiesById = [];

    this.nodesByDataNodeId = new Map();
    this.inEdgesByDDGNodeId = new Map();
    this.outEdgesByDDGNodeId = new Map();

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
                // → this edge has already been inserted, meaning there are multiple connections between exactly these two nodes
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

    this.nodes = [];
    this.edges = [];

    const timelineBuilder = new DDGTimelineBuilder();

    for (let traceId = bounds.minTraceId; traceId <= bounds.maxTraceId; ++traceId) {
      timelineBuilder.visitTrace(traceId);

      for (const dataNode of dp.util.getDataNodesOfTrace(traceId)) {
        const dataNodeId = dataNode.nodeId;
        if (nodesByDataNodeId[dataNodeId]) {
          timelineBuilder.addDataNode(dataNodeId);
        }
      }
    }


    /** ########################################
     * phase 3: create edges
     * #######################################*/

    for (const fromDataNodeId of nodesByDataNodeId) {
      if (!fromDataNodeId) {
        continue;
      }

      const fromDdgNode = getDDGNode(TODO);
      const toNodeIds = edgesByFromDataNodeId[fromDataNodeId];
      for (const toNodeId of toNodeIds) {
        // get or create DDGNodes
        const newNode = getDDGNode(TODO);
        this._addEdge(fromDdgNode, newNode);
      }
    }


    /** ########################################
     * phase 4: use edges to gather connectivity data for nodes
     *  ######################################*/
    for (const node of TODO) {
      const nIncomingEdges = this.inEdgesByDDGNodeId.get(node.ddgNodeId)?.length || 0;
      const nOutgoingEdges = this.outEdgesByDDGNodeId.get(node.ddgNodeId)?.length || 0;

      node.nInputs = nIncomingEdges;
      node.nOutputs = nOutgoingEdges;
    }
  }
}
