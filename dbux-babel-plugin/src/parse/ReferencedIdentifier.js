import { Binding } from '@babel/traverse';
import TraceType from '@dbux/common/src/core/constants/TraceType';
import BaseNode from './BaseNode';

export default class ReferencedIdentifier extends BaseNode {
  /**
   * @type {Binding}
   */
  binding;

  // ###########################################################################
  // binding
  // ###########################################################################

  getBinding() {
    return this.binding;
  }

  getBindingPath() {
    return this.binding?.path;
  }

  getBindingNode() {
    const bindingPath = this.getBindingPath();
    return bindingPath && this.getNodeOfPath(bindingPath) || null;
  }

  // ###########################################################################
  // traceId
  // ###########################################################################

  getBindingTidIdentifier() {
    return this.getBindingNode()?.getTidIdentifier();
  }

  // ###########################################################################
  // inputs
  // ###########################################################################

  createInputTrace() {
    // TODO: also handle globals
    const varNode = this.getBindingNode();

    const rawTraceData = {
      path: this.path,
      node: this,
      traceType: TraceType.Identifier,
      varNode,
      staticTraceData: {
        dataNode: {
          isNew: false,
          isWrite: false
        }
      }
    };

    return this.addTrace(rawTraceData);
  }

  // ###########################################################################
  // enter
  // ###########################################################################

  enter() {
    const { path } = this;
    // see https://github.com/babel/babel/blob/672a58660f0b15691c44582f1f3fdcdac0fa0d2f/packages/babel-traverse/src/scope/index.ts#L215
    const binding = this.binding = path.scope.getBinding(path.node.name);

    // NOTE: `!binding` indicates that this is a global (or otherwise not previously defined variable)

    // if (!binding) {
    //   throw new Error(`Weird Babel issue - ReferencedIdentifier does not have binding - ${this}`);
    // }

    const plugin = this.stack.peekPlugin('StaticContext');
    plugin.addBinding(path, binding);
  }
}