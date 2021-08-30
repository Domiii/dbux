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
    const { nodeId } = this.trace;
    const dataNodes = this.getTraceDataNodes().filter(node => node.nodeId !== nodeId);
    return dataNodes
      .map(node => this.treeNodeProvider.buildNode(ChildDataNode, this.trace, this, { dataNode: node }));
  }
}
