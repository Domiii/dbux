import TraceType from '@dbux/common/src/core/constants/TraceType';
import Expression from './Expression';


export default class ArithmeticExpression extends Expression {
  static plugins = ['Traces'];

  // ###########################################################################
  // Exit
  // ###########################################################################

  exit() {
    // const [...inputs, inputPaths] = args; // NOTE: esnext does not allow this (yet)
    const { node } = this;
    const { path } = node;
    const childNodes = node.getChildNodes();
    // const childPaths = node.getChildPaths();

    const traces = node.getPlugin('Traces');

    // TODO: trace children, if not traced already

    // trace AE itself
    const type = TraceType.ExpressionResult;
    const staticTraceData = {
      dataNode: {
        isNew: true,
        isWrite: false
      }
    };

    const varNode = null;

    // TODO: make sure that childNodes are traced if `literal` or `identifier`
    const inputNodes = childNodes;

    traces.addTrace(path, type, varNode, inputNodes, staticTraceData);

    // NOTE: AEs propagate all their inputs (their inputs should be captured by next in chain)
    // const propagatedInputs = this.getInputs(childNodes, childPaths);
    // return {
    //   isNew: true, // new value
    //   inputs: propagatedInputs,
    //   propagatedInputs
    // };
  }

  instrument() {

    //   const { path, state, data } = this;
    //   const { scope } = path;

    //   // TODO
  }
}