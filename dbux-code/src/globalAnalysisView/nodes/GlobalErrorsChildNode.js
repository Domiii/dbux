import TraceNode from '../../codeUtil/treeView/TraceNode';

export default class GlobalErrorsChildNode extends TraceNode {
  canHaveChildren() {
    return true;
  }

  buildChildren() {
    return this.childTraces.map(t => this.treeNodeProvider.buildNode(TraceNode, t, this));
  }

  getSelectedChildren() {
    if (!this.children) {
      this.treeNodeProvider.buildChildren(this);
    }
    return this.children.find(child => child.isSelected());
  }
}