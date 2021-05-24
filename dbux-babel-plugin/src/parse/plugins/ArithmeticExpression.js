import DataNodeType from '@dbux/common/src/core/constants/DataNodeType';
import TraceType from '@dbux/common/src/core/constants/TraceType';
import { getPresentableString } from '../../helpers/pathHelpers';
import ParsePlugin from '../../parseLib/ParsePlugin';


export default class ArithmeticExpression extends ParsePlugin {
  // ###########################################################################
  // exit
  // ###########################################################################

  exit() {
    // const [...inputs, inputPaths] = args; // NOTE: esnext does not allow this (yet)
    const { node } = this;
    const { path, Traces } = node;
    // const childNodes = node.getChildNodes();
    const childPaths = node.getChildPaths();

    this.warn('childPaths', childPaths.map(c => getPresentableString(c)));

    // trace AE itself
    const staticTraceData = {
      type: TraceType.ExpressionResult
    };
    // const inputNodes = childNodes;

    const traceData = { path, node, staticTraceData };

    Traces.addTraceWithInputs(traceData, childPaths);
  }

  // instrument() {
  //   //   const { path, state, data } = this;
  //   //   const { scope } = path;
  //   //   // TODO
  // }
}