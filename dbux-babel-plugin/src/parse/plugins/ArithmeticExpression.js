import TraceType from '@dbux/common/src/core/constants/TraceType';
import Expression from './Expression';


export default class ArithmeticExpression extends Expression {
  static plugins = ['Traces'];

  // ###########################################################################
  // Exit
  // ###########################################################################

  exit() {
    // const [...inputs, inputPaths] = args; // NOTE: esnext does not allow this (yet)
    const childNodes = this.node.getChildNodes();
    const childPaths = this.node.getChildPaths();

    // TODO: trace children, if not traced already
    const traces = this.node.getPlugin('Traces');

    const type = TraceType.ExpressionResult;
    const staticTraceData = {
      dataNode: {
        isNew: true,
        isWrite: false
      }
    };
    traces.addTrace(type, staticTraceData);

    // NOTE: AEs change, i.e. create new values (don't just move data)
    // NOTE2: AEs propagate all their inputs (their inputs should be captured by next in chain)
    // const propagatedInputs = this.getInputs(childNodes, childPaths);
    // return {
    //   isNew: true, // new value
    //   inputs: propagatedInputs,
    //   propagatedInputs
    // };
  }

  // instrument() {
  //   const { path, state, data } = this;
  //   const { scope } = path;

  //   // TODO
  // }
}