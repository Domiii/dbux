import ChildDataNode from './ChildDataNode';
import DataNode from './DataNode';

/**
 * @property {number} nodeId
 */
export default class ParentDataNode extends DataNode {
  canHaveChildren() {
    return this.getTraceDataNodes().length > 1;
  }

  buildChildren() {
    const { nodeId } = this;
    const dataNodes = this.getTraceDataNodes().filter(node => node.nodeId !== nodeId);
    return dataNodes.map(node => this.treeNodeProvider.buildNode(ChildDataNode, this.trace, this, { nodeId: node.nodeId }));
  }
}
