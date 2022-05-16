/** @typedef {import('../RuntimeDataProvider').default} RuntimeDataProvider */
/** @typedef { import('@dbux/common/src/types/constants/DataNodeType').default } DataNodeType */
/** @typedef { import('@dbux/common/src/types/constants/DataNodeType').DataNodeTypeValue } DataNodeTypeValue */


// import DDGWatchSet from './DDGWatchSet';
// import DDGTimeline from './DDGTimeline';
import DataNodeType from '@dbux/common/src/types/constants/DataNodeType';
import DDGBounds from './DDGBounds';
import DDGNode from './DDGNode';
import DDGEdge from './DDGEdge';
import DDGEntity from './DDGEntity';
import DDGEdgeType from './DDGEdgeType';
import { isBeforeCallExpression, isTraceReturn } from '@dbux/common/src/types/constants/TraceType';
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
   * @type {DDGEdge[]}
   */
  nodes;
  /**
   * @type {DDGNode[]}
   */
  edges;


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
    let ddgNode = this.nodesByDataNodeId.get(dataNode.nodeId);
    if (!ddgNode) {
      const ddgNodeType = dataNode.type; // TODO!
      const label = this._getDataNodeLabel(dataNode);
      ddgNode = new DDGNode(ddgNodeType, dataNode.nodeId, label);
      this._addEntity(ddgNode);
      this.nodes.push(ddgNode);
      this.nodesByDataNodeId.set(dataNode.nodeId, ddgNode);
    }
    return ddgNode;
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
    // this.selectedSet = new DDGWatchSet(this, inputNodes);
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
              const newEdge = new DDGEdge(DDGEdgeType.Write, fromDdgNode.entityId, newNode.entityId);
              this._addEntity(newEdge);
              this.edges.push(newEdge);
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
}



// // ########################################################################
// // class DataDependencyGraph:
// // ########################################################################
// /** @type {DDGWatchSet} */
// watchSet;
// edges;
// // writeNodes;

// build(inputNodes):
// this.watchSet = new DDGWatchSet(inputNodes)

// // visited = ...
// // for dataNode in this.watchSet:
// //  prepareDfs(dataNode, visited);

// visited = ...
// for dataNode in this.watchSet:
//   addWriteEdges(dataNode, dataNode, visited);

// buildNodeGroups; // put all `DataNode`s of same `getNodeGroupId(dataNode)` into the same `DDGNodeGroup`
// buildEdgeGroups; // put all edges of same `getEdgeGroupId(edge)` into the same `DDGEdgeGroup`
// // TODO: addControlEdges

// getEdgeGroupId(edge):
// groupId = ...; // same `type`, `getNodeGroupId(from)` and `getNodeGroupId(to)` → same id
// return groupId;

// /**
//  * Pre-processing: find all write nodes in DFG subgraph.
//  * @deprecated Not used (for now).
//  */
// prepareDfs(node, visited):
// if (node is not in bounds):
// // TODO: also add (some) external nodes
// return
// handleVisited

// // // prepare writeNodes
// // if (node is write): this.writeNodes.push(node);

// // go backward
// for e in inputsOf(node):
//   prepareDfs(e, visited);

// // go forward
// for e in outputsOf(node):
//   prepareDfs(e, visited);


// getNodeGroupId(dataNode):
// switch type:
//   case Compute:
//     groupBy = getOwnStaticTraceId(dataNode)
//     break;
//   case Read:
//   case Write:
//     // TODO: fix grouping → then fix the watchSet data structure to allow for the necessary queries
//     // Read + Write are both targeting potential memory addresses (`accessId`s)
//     // → (probably?) either a (i) var, (ii) ME (MemberExpression; e.g. `a[x]` or `b.y`) or (iii) constant?
//     inputGroupBy = getWatchSetGroupId(dataNode)
//     if (isInWatchSet(inputGroupBy)):
//       // → is in watchSet
//       groupBy = inputGroupBy
//     else if (isVar()): // has `varAccess.declarationTid`
//       groupBy = getStaticTraceId(varAccess.declarationTid)
//     else if (isME()): // has `varAccess.objectNodeId`
//       // an accessor of a variable that is not part of `watchSet` → add edge from outer most object instead
//       const leftMostDataNode = dp.util.getLeftMostObject(dataNode); // → NOTE: recurse on `varAccess.objectNodeId`
//     if leftMostDataNode?.varAccess?.declarationTid:
//       // variable
//       // e.g.: `a.b.c.d.e` → group by `a`'s `declaration`'s `staticTraceId`
//       groupBy = getStaticTraceId(leftMostDataNode.varAccess.declarationTid)
//     else:
//     // not a variable
//     // e.g.: `[[0, 1], [2, 3]][0].x.y` or `'my string'.length` → group by left-most `staticTraceId`
//     groupBy = getOwnStaticTraceId(leftMostDataNode)
//           else:   // constant (or otherwise unspecified)
//     groupBy = getOwnStaticTraceId(dataNode)
//     break;

//     return makeNumericId(groupBy)   // → use the `accessUIdMap` trick

//     /**
//      * Add all potential write edges toward `targetNode` (via `dataNode`).
//      */
//     addWriteEdges(targetNode, dataNode, visited):
//     handleVisited
//     handleBounds // → if `dataNode` is out of bounds, it is an external node

//     if (targetNode !== dataNode) {
//       // add edge
//       addWriteEdge(from = dataNode, to = targetNode);

//       // keep finding edges to this node now
//       targetNode = dataNode
//     }

//     // keep backtracking
//     for e in inputsOf(node):
//       prepareDfs(targetNode, e, visited);
