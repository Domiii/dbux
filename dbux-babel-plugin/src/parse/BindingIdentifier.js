// import { Binding } from '@babel/traverse';
// import TraceType from '@dbux/common/src/core/constants/TraceType';
import DataNodeType from '@dbux/common/src/core/constants/DataNodeType';
import TraceType from '@dbux/common/src/core/constants/TraceType';
import BaseId from './BaseId';

/**
 * NOTE: The `bindingPath` (and thus `bindingNode`) is usually the parent of the `BindingIdentifier`
 */
export default class BindingIdentifier extends BaseId {
  bindingTrace;

  getTidIdentifier() {
    if (!this.bindingTrace) {
      throw new Error(`Tried to "getTidIdentifier" too early in ${this} - bindingTrace was not created yet.`);
    }
    return this.bindingTrace.tidIdentifier;
  }


  // ###########################################################################
  // exit1
  // ###########################################################################
  
  exit1() {
    this.peekStaticContext().addDeclaration(this);
  }
}