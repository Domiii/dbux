/** @typedef {import('../RuntimeDataProvider').default} RuntimeDataProvider */

// import DDGWatchSet from './DDGWatchSet';
// import DDGTimeline from './DDGTimeline';
import DDGBounds from './DDGBounds';

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
  edges;
  nodes;


  /**
   * 
   * @param {RuntimeDataProvider} dp 
   */
  constructor(dp) {
    this.dp = dp;
  }

  /** ###########################################################################
   * {@link #build}
   * ##########################################################################*/

  build(watchTraceIds) {
    // this.selectedSet = inputNodes;
    // this.selectedSet = new DDGWatchSet(this, inputNodes);
    this.bounds = new DDGBounds(watchTraceIds);

    this.entitiesById = [];
    this.nodes = [];
    this.edges = [];


    for (let nodeId = minNodeId; nodeId <= maxNodeId; nodeId++) {
      const dataNode = this.dp.collections.dataNodes.getById(nodeId);
      this.nodes.push(dataNode);
      if (dataNode.inputs) {
        for (const inputNodeId of dataNode.inputs) {
          if (minNodeId <= inputNodeId && inputNodeId <= maxNodeId) {
            this.edges.push({ from: inputNodeId, to: nodeId });
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
