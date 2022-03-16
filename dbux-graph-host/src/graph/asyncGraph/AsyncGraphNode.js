/** @typedef {import('@dbux/common/src/types/AsyncNode').default} AsyncNode */
/** @typedef {import('./AsyncGraphHoleNode').default} AsyncGraphHoleNode */

/**
 * This represents a "node" in ACG, storing their related `AsyncNode` data
 */
export default class AsyncGraphNode {
  /**
   * @param {AsyncNode} asyncNode 
   * @param {AsyncGraphNode | AsyncGraphHoleNode} parent 
   */
  constructor(asyncNode, parent) {
    this.isHole = false;
    this.asyncNode = asyncNode;
    this.parent = parent;
  }
}