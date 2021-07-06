import SpecialIdentifierType from '@dbux/common/src/core/constants/SpecialIdentifierType';
import TraceType from '@dbux/common/src/core/constants/TraceType';
import { ZeroNode } from '../instrumentation/builders/buildUtil';
import { buildTraceExpressionVar } from '../instrumentation/builders/misc';
import BaseId from './BaseId';

export default class ThisExpression extends BaseId {
  get specialType() {
    return SpecialIdentifierType.This;
  }

  getDeclarationNode() {
    // hackfix: for now, just don't care about getDeclarationNode
    return null;
  }

  getDeclarationTidIdentifier() {
    // hackfix: for now, just don't care about declarationTid
    //    NOTE: can use `refId` to trace access, since they 100% coincide)
    return ZeroNode;
  }

  /**
   * 
   */
  buildDefaultTrace() {
    const traceData = {
      path: this.path,
      node: this,
      staticTraceData: {
        type: TraceType.Identifier
      },
      meta: {
        build: buildTraceExpressionVar
      }
    };

    return traceData;
  }

  // ###########################################################################
  // enter
  // ###########################################################################

  enter() {
    this.peekStaticContext().addReferencedBinding(this);
  }
}