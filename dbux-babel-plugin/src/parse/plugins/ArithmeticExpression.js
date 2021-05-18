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
    // const childNodes = node.getChildNodes();
    const childPaths = node.getChildPaths();

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
    // const inputNodes = childNodes;

    // TODO: propagate inputs
    traces.addTraceWithInputs(path, type, varNode, childPaths, staticTraceData);
  }

  instrument() {

    //   const { path, state, data } = this;
    //   const { scope } = path;

    //   // TODO
  }
}