import SpecialIdentifierType from '@dbux/common/src/types/constants/SpecialIdentifierType';
import { ZeroNode } from '../instrumentation/builders/buildUtil';
import BaseId from './BaseId';

export default class ImportExpression extends BaseId {
  get specialType() {
    return SpecialIdentifierType.Import;
  }

  getDeclarationNode() {
    // hackfix: for now, just don't care about getDeclarationNode
    return null;
  }

  getDeclarationTidIdentifier() {
    // hackfix: for now, just don't care about declarationTid
    //    NOTE: luckily, most of these are objects, so we can use `refId` to trace access.
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