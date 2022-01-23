import ChildDataNode from './ChildDataNode';
import DataFlowNode from './DataFlowNode';

/**
 * @property {number} nodeId
 */
export default class ParentDataNode extends DataFlowNode {
  canHaveChildren() {
    return this.getTraceDataNodes().length > 1;
  }

  buildChildren() {
    const { nodeId } = this.dataNode;
    const dataNodes = this.getTraceDataNodes().filter(node => node.nodeId !== nodeId);
    return dataNodes
      .map(node => this.treeNodeProvider.buildNode(ChildDataNode, node, this));
  }
}
