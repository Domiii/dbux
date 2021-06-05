import TraceType from '@dbux/common/src/core/constants/TraceType';
import { pathToString } from '../../helpers/pathHelpers';
import ParsePlugin from '../../parseLib/ParsePlugin';


export default class ArithmeticExpression extends ParsePlugin {
  // ###########################################################################
  // exit
  // ###########################################################################

  addTraces() {
    // const [...inputs, inputPaths] = args; // NOTE: esnext does not allow this (yet)
    const { node } = this;
    const { path, Traces } = node;
    // const childNodes = node.getChildNodes();
    const childPaths = node.getChildPaths();

    // this.warn('childPaths', childPaths.map(c => pathToString(c)));

    // trace AE itself
    const staticTraceData = {
      type: TraceType.ExpressionResult
    };
    const traceData = { 
      path,
      node,
      staticTraceData
    };
    Traces.addTraceWithInputs(traceData, childPaths);
  }

  exit() {
    this.addTraces();
  }

  // instrument() {
  //   //   const { path, state, data } = this;
  //   //   const { scope } = path;
  //   //   // TODO
  // }
}