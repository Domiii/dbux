// import { Binding } from '@babel/traverse';
// import TraceType from '@dbux/common/src/core/constants/TraceType';
import BaseNode from './BaseNode';

/**
 * BaseId provides binding-related utilities.
 * 
 * NOTE: The `bindingPath` (and thus `bindingNode`) is usually the parent of the `BindingIdentifier`.
 */
export default class BaseId extends BaseNode {
  /**
   * @type {Binding}
   */
  _binding;

  get binding() {
    if (!this._binding) {
      const { path } = this;
      // see https://github.com/babel/babel/blob/672a58660f0b15691c44582f1f3fdcdac0fa0d2f/packages/babel-traverse/src/scope/index.ts#L215
      this._binding = path.scope.getBinding(path.node.name);
    }
    return this._binding;
  }

  // TODO: getBindingNode

  getDeclarationIdPath() {
    const path = this.binding?.path;
    if (!path) {
      return null;
    }
    // NOTE: binding.path often refers to the Declaration, not the `id` node.
    // NOTE2: even more odd for `CatchClause.param` it returns `CatchClause` node.
    return path.isIdentifier() && path || path.get('id') || this.getNodeOfPath(path)?.getDeclarationIdPath;
  }

  /**
   * @returns {BindingIdentifier}
   */
  getDeclarationNode() {
    const bindingPath = this.getDeclarationIdPath();
    if (!bindingPath?.node) {
      return null;
    }
    // this.debug(`[RId] bindingPath L${bindingPath.node.loc.start.line}: ${bindingPath.toString()}`);
    return bindingPath && this.getNodeOfPath(bindingPath) || null;
  }

  // ###########################################################################
  // tree accessors
  // ###########################################################################

  /**
   * @type {BindingNode}
   */
  peekBindingNode() {
    return this.stack.peekPlugin('BindingNode');
  }
}
