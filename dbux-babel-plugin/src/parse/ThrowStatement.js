import TraceType from '@dbux/common/src/core/constants/TraceType';
import BaseNode from './BaseNode';

export default class ThrowStatement extends BaseNode {
  static children = ['argument'];

  exit() {
    const { path } = this;
    const childPaths = this.getChildPaths();
    const [argPath] = childPaths;

    const traceData = {
      node: this,
      path,
      staticTraceData: {
        type: TraceType.ThrowArgument,
      },
      meta: {
        traceCall: 'traceThrow',
        replacePath: argPath
      }
    };

    return this.addTraceWithInputs(traceData, [argPath]);
  }
}