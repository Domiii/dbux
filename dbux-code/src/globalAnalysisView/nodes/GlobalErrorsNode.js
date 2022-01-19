import BaseTreeViewNode from '../../codeUtil/treeView/BaseTreeViewNode';
import GlobalErrorsChildNode from './GlobalErrorsChildNode';

/** @typedef {import('@dbux/common/src/types/Trace').default} Trace */
/** @typedef {import('../ErrorTraceManager').default} ErrorTraceManager */

export const GlobalErrorNodeContextValue = 'dbuxGlobalAnalysisView.node.globalError';

/** ###########################################################################
 * {@link GlobalErrorsNode}
 * ##########################################################################*/

export default class GlobalErrorsNode extends BaseTreeViewNode {
  static makeLabel(entry, parent, moreProps, provider) {
    const errorTraces = provider.controller.errorTraceManager.getAll();
    const icon = errorTraces.length ? ' 🔥' : '';
    return `Errors${icon}`;
  }

  /**
   * @type {ErrorTraceManager}
   */
  get errorTraceManager() {
    return this.treeNodeProvider.controller.errorTraceManager;
  }

  init() {
    const errorTraces = this.errorTraceManager.getLeaves();
    this.contextValue = GlobalErrorNodeContextValue;
    this.description = `(${errorTraces.length})`;
  }

  getSelectedChildren() {
    for (const errorParent of this.children) {
      if (errorParent.isSelected()) {
        return errorParent;
      }
      const selectedErrorLeaf = errorParent.getSelectedChildren();
      if (selectedErrorLeaf) {
        return selectedErrorLeaf;
      }
    }
    return null;
  }

  buildChildren() {
    const leaves = this.errorTraceManager.getLeaves().reverse();

    return leaves.map(leaf => {
      const errorsOnStack = this.errorTraceManager.getErrorsByLeaf(leaf);
      return this.treeNodeProvider.buildNode(GlobalErrorsChildNode, leaf, this, { childTraces: errorsOnStack });
    });
  }
}
