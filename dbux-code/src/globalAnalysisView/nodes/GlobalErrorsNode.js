import TraceNode from '../../codeUtil/treeView/TraceNode';
import BaseTreeViewNode from '../../codeUtil/treeView/BaseTreeViewNode';

/** @typedef {import('@dbux/common/src/types/Trace').default} Trace */

/** ###########################################################################
 * {@link GlobalErrorsNode}
 * ##########################################################################*/

export default class GlobalErrorsNode extends BaseTreeViewNode {
  static makeLabel() {
    return `Errors`;
  }

  getSelectedChildren() {
    for (const child of this.children) {
      if (child.isSelected()) {
        return child;
      }
    }
    return null;
  }

  buildChildren() {
    const errorTraces = this.treeNodeProvider.controller.errorTraceManager.getAll();
    return errorTraces.map(trace => {
      return this.treeNodeProvider.buildNode(TraceNode, trace, this);
    });
  }
}
