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

  getSelectedChild() {
    if (!this.children) {
      return null;
    }

    // find in children
    const selectedChild = this.children.find(child => child.isSelected());
    if (selectedChild) {
      return selectedChild;
    }

    // find in further descendants
    for (const child of this.children) {
      const selectedDescendant = child.getSelectedChild();
      if (selectedDescendant) {
        return selectedDescendant;
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
