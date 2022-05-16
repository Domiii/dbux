/** @typedef {import('../RuntimeDataProvider').default} RuntimeDataProvider */
/** @typedef { import('@dbux/common/src/types/constants/DataNodeType').default } DataNodeType */
/** @typedef { import('@dbux/common/src/types/constants/DataNodeType').DataNodeTypeValue } DataNodeTypeValue */


import DDGWatchSet from './DDGWatchSet';
// import DDGTimeline from './DDGTimeline';
import DataNodeType from '@dbux/common/src/types/constants/DataNodeType';
import { isBeforeCallExpression, isTraceReturn } from '@dbux/common/src/types/constants/TraceType';
import DDGBounds from './DDGBounds';
import DDGNode from './DDGNode';
import DDGEdge from './DDGEdge';
import DDGEntity from './DDGEntity';
import DDGEdgeType from './DDGEdgeType';
import { makeTraceLabel } from '../helpers/makeLabels';

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
  constructor(dp) {
    this.dp = dp;
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

  /**
   * @param {DataNode} dataNode 
   * @return {DDGNode}
   */
  _getOrCreateDDGNode(dataNode) {
    const dataNodeId = dataNode.nodeId;
    let ddgNode = this.nodesByDataNodeId.get(dataNodeId);
    if (!ddgNode) {
      ddgNode = this._addNode(dataNode);
    }
    return ddgNode;
  }

  _addNode(dataNode) {
    const dataNodeId = dataNode.nodeId;
    const dataNodeType = dataNode.type; // TODO!
    const label = this._getDataNodeLabel(dataNode);

    const ddgNode = new DDGNode(dataNodeType, dataNodeId, label);
    ddgNode.watched = this.watchSet.isWatchedDataNode(dataNodeId);
    ddgNode.ddgNodeId = this.nodes.length;

    this._addEntity(ddgNode);
    this.nodes.push(ddgNode);

    this.nodesByDataNodeId.set(dataNodeId, ddgNode);
    return ddgNode;
  }

  _addEdgeToMap(map, id, edge) {
    let edges = this.inEdgesByDDGNodeId.get(id);
    if (!edges) {
      this.inEdgesByDDGNodeId.set(id, edges = []);
    }
    edges.push(edge);
  }

  /**
   * @param {DDGNode} fromDdgNode 
   * @param {DDGNode} toNode 
   */
  _addEdge(fromDdgNode, toNode) {
    const newEdge = new DDGEdge(DDGEdgeType.Write, fromDdgNode.entityId, toNode.entityId);

    this._addEntity(newEdge);
    this.edges.push(newEdge);

    this._addEdgeToMap(this.inEdgesByDDGNodeId, toNode.ddgNodeId, newEdge);
    this._addEdgeToMap(this.outEdgesByDDGNodeId, fromDdgNode.ddgNodeId, newEdge);
  }

  _getDataNodeLabel(dataNode) {
    const { dp } = this;
    const { nodeId: dataNodeId } = dataNode;

    // variable name
    const varName = dp.util.getDataNodeDeclarationVarName(dataNodeId);
    let label = '';
    if (varName) {
      label = varName;
    }
    else if (dataNode.traceId) {
      const staticTrace = dp.util.getStaticTrace(dataNode.traceId);
      // NOTE: staticTrace.dataNode.label is used for `Compute` (and some other?) nodes
      label = staticTrace.dataNode?.label;
      if (!label) {
        if (isTraceReturn(staticTrace.type)) {
          // return label
          label = 'ret';
        }
        else if (dp.util.isTraceOwnDataNode(dataNodeId)) {
          // default trace label
          const trace = dp.util.getTrace(dataNode.traceId);
          label = makeTraceLabel(trace);
        }
        else {
          // TODO: ME
        }
      }
    }
    // else {
    // }

    // TODO: nested DataNodes don't have a traceId (or they don't own it)
    return label;
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
    this.nodes = [];
    this.edges = [];

    this.nodesByDataNodeId = new Map();

    for (let dataNodeId = bounds.minNodeId; dataNodeId <= bounds.maxNodeId; ++dataNodeId) {
      const dataNode = dp.collections.dataNodes.getById(dataNodeId);

      if (dataNode.inputs) {
        // don't add duplicate edges
        const fromDataNodeIdsSet = new Set();
        for (const fromDataNodeId of dataNode.inputs) {
          if (!bounds.containsNode(fromDataNodeId)) {
            // TODO: handle external nodes
          }
          else {
            let fromDataNode = dp.util.getDataNode(fromDataNodeId);
            if (fromDataNode.refId) {
              throw new Error('TODO: fix `valueFromId` for reference types');
            }

            while (this._shouldSkipDataNode(fromDataNodeId)) {
              const valueFromNode = dp.util.getDataNode(fromDataNode.valueFromId);
              if (!valueFromNode) {
                break;
              }
              if (!bounds.containsNode(valueFromNode.nodeId)) {
                // TODO: handle external nodes
                break;
              }
              fromDataNode = valueFromNode;
            }

            if (!fromDataNodeIdsSet.has(fromDataNode.nodeId)) {
              // add DDGEdge
              fromDataNodeIdsSet.add(fromDataNode.nodeId);
              // get or create DDGNode
              const fromDdgNode = this._getOrCreateDDGNode(fromDataNode);
              const newNode = this._getOrCreateDDGNode(dataNode);
              this._addEdge(fromDdgNode, newNode);
            }
            else {
              // → this edge has already been inserted, meaning there are multiple connections between exactly these two nodes
              // TODO: make it a GroupEdge with `writeCount` and `controlCount` instead?
            }
          }
        }
      }
    }

    /** ########################################
     * phase 2
     *  ######################################*/
    for (const node of this.nodes) {
      const nIncomingEdges = this.inEdgesByDDGNodeId.get(node.ddgNodeId)?.length || 0;
      const nOutgoingEdges = this.outEdgesByDDGNodeId.get(node.ddgNodeId)?.length || 0;

      node.nInputs = nIncomingEdges;
      node.nOutputs = nOutgoingEdges;
    }
  }
}
