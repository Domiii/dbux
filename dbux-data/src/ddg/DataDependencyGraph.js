/** @typedef {import('../RuntimeDataProvider').default} RuntimeDataProvider */
/** @typedef { import('@dbux/common/src/types/constants/DataNodeType').default } DataNodeType */
/** @typedef { import('@dbux/common/src/types/constants/DataNodeType').DataNodeTypeValue } DataNodeTypeValue */


import DDGWatchSet from './DDGWatchSet';
// import DDGTimeline from './DDGTimeline';
import DataNodeType from '@dbux/common/src/types/constants/DataNodeType';
import TraceType, { isBeforeCallExpression, isTraceReturn } from '@dbux/common/src/types/constants/TraceType';
import DDGBounds from './DDGBounds';
import DDGNode from './DDGNode';
import DDGEdge from './DDGEdge';
import DDGEntity from './DDGEntity';
import DDGEdgeType from './DDGEdgeType';
import { makeTraceLabel } from '../helpers/makeLabels';
import DDGTimelineNodeType from './DDGTimelineNodeType';
import { ContextTimelineNode, DDGTimelineNode } from './DDGTimelineNodes';

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
   * labels
   * ##########################################################################*/

  _makeDataNodeLabel(dataNode) {
    const { dp } = this;
    const { nodeId: dataNodeId, traceId } = dataNode;

    // get trace data
    const { staticTraceId, nodeId: traceNodeId } = this.dp.collections.traces.getById(traceId);
    const isTraceOwnDataNode = traceNodeId === dataNodeId;
    const ownStaticTrace = isTraceOwnDataNode && this.dp.collections.staticTraces.getById(staticTraceId);
    const isNewValue = !!ownStaticTrace?.dataNode?.isNew;

    // variable name
    let label = '';
    if (dataNode.traceId) {
      // NOTE: staticTrace.dataNode.label is used for `Compute` (and some other?) nodes
      label = ownStaticTrace.dataNode?.label;
    }

    if (!label) {
      const varName = dp.util.getDataNodeDeclarationVarName(dataNodeId);
      if (!isNewValue && varName) {
        label = varName;
      }
      else if (isTraceReturn(ownStaticTrace.type)) {
        // return label
        label = 'ret';
      }
    }

    if (!label) {
      if (dp.util.isTraceOwnDataNode(dataNodeId)) {
        // default trace label
        const trace = dp.util.getTrace(dataNode.traceId);
        label = makeTraceLabel(trace);
      }
      else {
        // TODO: ME
      }
    }
    // else {
    // }

    // TODO: nested DataNodes don't have a traceId (or they don't own it)
    return label;
  }


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

  /**
   * @param {DataNode} dataNode 
   * @return {DDGNode}
   */
  _getOrCreateDDGNode(dataNode) {
    const dataNodeId = dataNode.nodeId;
    let ddgNode = this.nodesByDataNodeId.get(dataNodeId);
    if (!ddgNode) {
      ddgNode = this._addDDGNode(dataNode);
    }
    return ddgNode;
  }

  _addDDGNode(dataNode) {
    const dataNodeId = dataNode.nodeId;
    // const dataNodeType = dataNode.type; // TODO!
    const label = this._makeDataNodeLabel(dataNode);

    const ddgNode = new DDGNode(DDGTimelineNodeType.Data, dataNode, label);
    ddgNode.watched = this.watchSet.isWatchedDataNode(dataNodeId);
    ddgNode.ddgNodeId = this.nodes.length;

    this._addEntity(ddgNode);
    this.nodes.push(ddgNode);

    this.nodesByDataNodeId.set(dataNodeId, ddgNode);
    return ddgNode;
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
    const timelineParentsByDataNodeId = [];

    const rootTimelineNode = new DDGTimelineNode(DDGTimelineNodeType.Root);
    rootTimelineNode.timelineId = 1;

    /**
     * @type {DDGTimelineNode[]}
     */
    const timelineNodeStack = [];

    /** ########################################
     * phase 1: gather potential nodes and edges
     * NOTE: we take this extra step to assure properties of a sparse timeline:
     *   a) don't allocate unwanted nodes
     *   b) keep timeline ordering (order by `dataNodeId`)
     * #######################################*/

    for (let traceId = bounds.minTraceId; traceId <= bounds.maxTraceId; ++traceId) {
      const trace = dp.util.getTrace(traceId);
      const staticTrace = dp.util.getStaticTrace(traceId);
      if (TraceType.is.PushImmediate(staticTrace.type)) {
        timelineNodeStack.push(new ContextTimelineNode(trace.contextId));
      }
      else if (dp.util.isTraceControlGroupPop(traceId)) {
        timelineNodeStack.pop();
      }

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
              }
            }
          }
        }
      }
    }

    /** ########################################
     * phase 2: add nodes + edges
     * #######################################*/

    this.nodes = [];
    this.edges = [];

    for (const fromDataNodeId of nodesByDataNodeId) {
      if (!fromDataNodeId) {
        continue;
      }

      const toNodeIds = edgesByFromDataNodeId[fromDataNodeId];
      for (const toNodeId of toNodeIds) {
        // get or create DDGNodes
        const fromDdgNode = this._getOrCreateDDGNode(TODO);
        const newNode = this._getOrCreateDDGNode(TODO);
        this._addEdge(fromDdgNode, newNode);
      }
    }


    /** ########################################
     * phase 3: gather connectivity data for nodes
     *  ######################################*/
    for (const node of this.nodes) {
      const nIncomingEdges = this.inEdgesByDDGNodeId.get(node.ddgNodeId)?.length || 0;
      const nOutgoingEdges = this.outEdgesByDDGNodeId.get(node.ddgNodeId)?.length || 0;

      node.nInputs = nIncomingEdges;
      node.nOutputs = nOutgoingEdges;
    }
  }
}
