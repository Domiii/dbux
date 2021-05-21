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


  getBinding() {
    return this.binding;
  }

  getBindingPath() {
    return this.binding?.path;
  }

  /**
   * @returns {BindingNode}
   */
  getBindingNode() {
    const bindingPath = this.getBindingPath();
    if (!bindingPath) {
      return null;
    }
    this.debug(`[RId] bindingPath L${bindingPath.node.loc.start.line}: ${bindingPath.toString()}`);
    return bindingPath && this.getNodeOfPath(bindingPath) || null;
  }

  getBindingTidIdentifier() {
    return this.getBindingNode()?.getTidIdentifier();
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
