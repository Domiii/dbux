import TraceType from '@dbux/common/src/core/constants/TraceType';
import { getPresentableString } from '../helpers/pathHelpers';
import BaseExpression from './BaseExpression';


// ###########################################################################
// BaseArithmeticExpression
// ###########################################################################

export default class BaseArithmeticExpression extends BaseExpression {
  exit(...args) {
    // const [...inputs, inputPaths] = args; // NOTE: for some reason, es2020 does not allow this
    const inputN = this.nodeNames.length;
    const inputs = args.slice(0, inputN);
    const inputPaths = args[inputN];

    // NOTE: AEs change, i.e. create new values (don't just move data)
    // NOTE2: AEs propagate all their inputs (their inputs should be captured by next in chain)
    const propagatedInputs = this.getInputs(inputs, inputPaths);
    return {
      isNew: true, // new value
      inputs: propagatedInputs,
      propagatedInputs
    };
  }

  instrument() {
    const { path, state } = this;
    const { scope } = path;
    
    // TODO
  }
}