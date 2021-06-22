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

  /**
   * NOTE: The `bindingPath` (and thus `bindingNode`) is usually the parent of the `BindingIdentifier`
   * 
   * @returns {BindingIdentifier}
   */
  getDeclarationNode() {
    const path = this.binding?.path;
    if (!path) {
      return null;
    }
    // NOTE: `binding.path` (if is `Declaration`) refers to the Declaration, not the `id` node.
    // NOTE2: even more odd - for `CatchClause.param` it returns `CatchClause` the path.
    if (path.isIdentifier()) {
      return this.getNodeOfPath(path);
    }
    else if (path.node.id) {
      // future-work: override `getDeclarationNode` in Declarations instead.
      return this.getNodeOfPath(path.get('id'));
    }
    const bindingNode = this.getNodeOfPath(path);
    const declarationNode = bindingNode !== this && bindingNode.getDeclarationNode?.();
    return declarationNode;
  }
}
