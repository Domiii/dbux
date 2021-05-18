import TraceType from '@dbux/common/src/core/constants/TraceType';
import Expression from './Expression';


export default class ArithmeticExpression extends Expression {
  static plugins = ['Traces'];


  createInputTrace() {
    const rawTraceData = {
      path: this.path,
      node: this,
      traceType: TraceType.ExpressionResult,
      varNode: null,
      staticTraceData: {
        dataNode: {
          isNew: true,
          isWrite: false
        }
      }
    };

    return this.addTrace(rawTraceData);
  }

  // ###########################################################################
  // exit
  // ###########################################################################

  exit() {
    // const [...inputs, inputPaths] = args; // NOTE: esnext does not allow this (yet)
    const { node } = this;
    const { path } = node;
    // const childNodes = node.getChildNodes();
    const childPaths = node.getChildPaths();

    const traces = node.getPlugin('Traces');

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
    traces.addTraceWithInputs(path, node, type, varNode, childPaths, staticTraceData);
  }

  // instrument() {
  //   //   const { path, state, data } = this;
  //   //   const { scope } = path;
  //   //   // TODO
  // }
}