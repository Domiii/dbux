/** @typedef {import('./AsyncGraphNode').default} AsyncGraphNode */
/** @typedef {import('@dbux/common/src/types/AsyncNode').default} AsyncNode */

export default class AsyncGraphHoleNode {
  /**
   * @param {AsyncNode[]} asyncNodes 
   * @param {AsyncNode[]} frontier
   * @param {AsyncGraphNode} parent
   */
  constructor(asyncNodes, frontier, parent) {
    this.isHole = true;
    this.asyncNodes = asyncNodes;
    this.frontier = frontier;
    this.parent = parent;
  }
}