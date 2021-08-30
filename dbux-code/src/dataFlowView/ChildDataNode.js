import DataFlowNode from './DataFlowNode';

export default class ChildDataNode extends DataFlowNode {
  static makeLabel(trace, parent, props) {
    const { dataNode } = props;
    if (dataNode.varAccess) {
      return `[${dataNode.varAccess.prop}]`;
    }
    else {
      return `(orphan)`;
    }
  }

  canHaveChildren() {
    return false;
  }
}
