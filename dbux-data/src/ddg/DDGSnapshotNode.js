import DDGNode from './DDGNode';

export default class DDGSnapshotNode extends DDGNode {
  dataNode;

  /**
   * @param {DataNode} dataNode 
   */
  constructor(dataNodeId) {
    super();
    this.dataNodeId = dataNodeId;
  }
}