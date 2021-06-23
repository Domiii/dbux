import SpecialIdentifierType from '@dbux/common/src/core/constants/SpecialIdentifierType';
import { ZeroNode } from '../instrumentation/builders/buildUtil';
import BaseId from './BaseId';

export default class ThisExpression extends BaseId {
  get specialType() {
    return SpecialIdentifierType.Super;
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
    return null;
  }

  // ###########################################################################
  // enter
  // ###########################################################################

  enter() {
    this.peekStaticContext().addReferencedBinding(this);
  }
}