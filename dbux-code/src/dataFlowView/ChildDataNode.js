import DataFlowNode from './DataFlowNode';

export default class ChildDataNode extends DataFlowNode {
  static makeLabel(trace, parent, props) {
    const { dataNode } = props;
    return `[${dataNode.varAccess?.prop}]`;
  }

  canHaveChildren() {
    return false;
  }
}
