import DDGTimelineNode from './DDGTimelineNodes';
import DDGTimelineNodeType from './DDGTimelineNodeType';

export default class DDGSnapshotNode extends DDGTimelineNode {
  dataNode;

  /**
   * @type {DDGSnapshotNode | DDGNode}
   */
  children = [];

  /**
   * @param {DataNode} dataNode 
   */
  constructor(dataNode) {
    super(DDGTimelineNodeType.Snapshot);

    this.dataNode = dataNode;
  }
}