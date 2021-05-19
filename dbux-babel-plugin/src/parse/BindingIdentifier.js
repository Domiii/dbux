import { Binding } from '@babel/traverse';
import TraceType from '@dbux/common/src/core/constants/TraceType';
import BaseNode from './BaseNode';

/**
 * NOTE: The `bindingPath` (and thus `bindingNode`) is usually the parent of the `BindingIdentifier`
 */
export default class BindingIdentifier extends BaseNode {
  /**
   * @type {Binding}
   */
  _binding;

  // NOTE: `!binding` indicates that this is a global (or otherwise not previously defined variable)
  get binding() {
    if (!this._binding) {
      const { path } = this;
      // see https://github.com/babel/babel/blob/672a58660f0b15691c44582f1f3fdcdac0fa0d2f/packages/babel-traverse/src/scope/index.ts#L215
      this._binding = path.scope.getBinding(path.node.name);
    }
    return this._binding;
  }

  // ###########################################################################
  // binding
  // ###########################################################################

  getBinding() {
    return this.binding;
  }

  getBindingPath() {
    return this.binding.path;
  }

  /**
   * @returns {BaseNode}
   */
  getBindingNode() {
    const bindingPath = this.getBindingPath();
    this.debug(`[BId] bindingPath L${bindingPath.node.loc.start.line}: ${bindingPath.toString()}`);
    return bindingPath && this.getNodeOfPath(bindingPath) || null;
  }

  getBindingTidIdentifier() {
    return this.getBindingNode()?.getTidIdentifier();
  }

  // ###########################################################################
  // enter
  // ###########################################################################

  enter() {
    const { binding, path } = this;

    // if (!binding) {
    //   throw new Error(`Weird Babel issue - ReferencedIdentifier does not have binding - ${this}`);
    // }

    const plugin = this.stack.peekPlugin('StaticContext');
    plugin.addBinding(path, binding);
  }
}