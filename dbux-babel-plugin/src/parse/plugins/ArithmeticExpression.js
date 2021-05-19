import TraceType from '@dbux/common/src/core/constants/TraceType';
import { getPresentableString } from '../../helpers/pathHelpers';
import ParsePlugin from '../../parseLib/ParsePlugin';


export default class ArithmeticExpression extends ParsePlugin {
  static plugins = ['Traces'];


  createInputTrace() {
    const { node } = this;
    const rawTraceData = {
      path: node.path,
      node: node,
      varNode: null,
      staticTraceData: {
        type: TraceType.ExpressionResult,
        dataNode: {
          isNew: true,
          isWrite: false
        }
      }
    };

    const traces = node.getPlugin('Traces');
    return traces.addTrace(rawTraceData);
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

    this.warn('childPaths', childPaths.map(c => getPresentableString(c)));

    const traces = node.getPlugin('Traces');

    // trace AE itself
    const staticTraceData = {
      type: TraceType.ExpressionResult,
      dataNode: {
        isNew: true,
        isWrite: false
      }
    };

    const varNode = null;
    // const inputNodes = childNodes;

    // TODO: propagate inputs
    traces.addTraceWithInputs(path, node, varNode, staticTraceData, childPaths);
  }

  // instrument() {
  //   //   const { path, state, data } = this;
  //   //   const { scope } = path;
  //   //   // TODO
  // }
}