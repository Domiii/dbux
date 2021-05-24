import TraceType from '@dbux/common/src/core/constants/TraceType';
import BaseId from './BaseId';

export default class ReferencedIdentifier extends BaseId {
  // ###########################################################################
  // inputs
  // ###########################################################################

  /**
   * TODO: consider getting rid of this entirely?
   */
  createInputTrace() {
    const rawTraceData = {
      path: this.path,
      node: this,
      staticTraceData: {
        type: TraceType.Identifier
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

    this.peekStaticContext().addReferencedBinding(this);
  }
}