import TraceType from '@dbux/common/src/types/constants/TraceType';
import BasePlugin from './BasePlugin';


export default class ArithmeticExpression extends BasePlugin {
  get isNew() {
    return true;
  }

  addTraces() {
    // const [...inputs, inputPaths] = args; // NOTE: esnext does not allow this (yet)
    const { node } = this;
    const { path, Traces } = node;
    // const childNodes = node.getChildNodes();
    const childPaths = node.getDefaultChildPaths();

    // this.warn('childPaths', childPaths.map(c => pathToString(c)));

    // trace AE itself
    const staticTraceData = {
      type: TraceType.ExpressionResult,
      dataNode: {
        isNew: this.isNew,
        label: node.operator || path.node?.operator
      }
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
