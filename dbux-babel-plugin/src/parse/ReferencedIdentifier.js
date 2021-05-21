import { Binding } from '@babel/traverse';
import TraceType from '@dbux/common/src/core/constants/TraceType';
import DataNodeType from '@dbux/common/src/core/constants/DataNodeType';
import BaseId from './BaseId';
import StaticContext from './plugins/StaticContext';

export default class ReferencedIdentifier extends BaseId {

  // ###########################################################################
  // inputs
  // ###########################################################################

  createInputTrace() {
    const varNode = this.getBindingNode();

    if (!varNode) {
      // TODO: also handle globals
    }

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

  // ###########################################################################
  // enter
  // ###########################################################################

  enter() {
    // if (!binding) {
    //   throw new Error(`Weird Babel issue - ReferencedIdentifier does not have binding - ${this}`);
    // }

    this.peekStaticContext().addReferencedBinding(this.getBindingNode());
  }
}