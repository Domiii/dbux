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

    // NOTE: AEs changes, i.e. create new values (don't just move data)
    // NOTE2: AEs propagate all their inputs
    const propagatedInputs = this.getInputs(inputs, inputPaths);
    return {
      change: true,
      inputs: propagatedInputs,
      propagatedInputs
    };
  }
}