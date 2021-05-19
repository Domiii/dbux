import { Binding } from '@babel/traverse';
import TraceType from '@dbux/common/src/core/constants/TraceType';
import DataNodeType from '@dbux/common/src/core/constants/DataNodeType';
import BaseNode from './BaseNode';

export default class ReferencedIdentifier extends BaseNode {
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

  // ###########################################################################
  // binding
  // ###########################################################################

  getBinding() {
    return this.binding;
  }

  getBindingPath() {
    return this.binding?.path;
  }

  /**
   * @returns {BaseNode}
   */
  getBindingNode() {
    const bindingPath = this.getBindingPath();
    this.debug(`[RId] bindingPath L${bindingPath.node.loc.start.line}: ${bindingPath.toString()}`);
    return bindingPath && this.getNodeOfPath(bindingPath) || null;
  }

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
      varNode,
      staticTraceData: {
        type: TraceType.Identifier,
        dataNode: {
          isNew: false,
          type: DataNodeType.Read
        }
      }
    };

    return rawTraceData;
  }
}