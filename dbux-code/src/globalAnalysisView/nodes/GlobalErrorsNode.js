import TraceNode from '../../codeUtil/treeView/TraceNode';
import BaseTreeViewNode from '../../codeUtil/treeView/BaseTreeViewNode';

/** @typedef {import('@dbux/common/src/types/Trace').default} Trace */

/** ###########################################################################
 * {@link GlobalErrorsNode}
 * ##########################################################################*/

export default class GlobalErrorsNode extends BaseTreeViewNode {
  static makeLabel(entry, parent, moreProps, provider) {
    const errorTraces = provider.controller.errorTraceManager.getAll();
    const icon = errorTraces.length ? ' 🔥' : '';
    return `Errors${icon}`;
  }

  get errorTraceManager() {
    return this.treeNodeProvider.controller.errorTraceManager;
  }

  init() {
    const errorTraces = this.errorTraceManager.getLeaves();
    this.description = `(${errorTraces.length})`;
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
    const errorTraces = this.errorTraceManager.getAll();
    return errorTraces.map(trace => {
      return this.treeNodeProvider.buildNode(TraceNode, trace, this);
    });
  }
}
