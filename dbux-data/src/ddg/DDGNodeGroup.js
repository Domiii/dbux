/** @typedef {import('@dbux/common/src/types/DataNode').default} DataNode */

export default class DDGNodeGroup {
  /**
   * @type {DDGEdge[]}
   */
  nodes;

  constructor() {
    this.nodes = [];
  }
}
