import TraceType from '@dbux/common/src/types/constants/TraceType';
import BaseNode from './BaseNode';

export default class ThrowStatement extends BaseNode {
  static children = ['argument'];

  exit() {
    const { path, Traces } = this;
    const [argPath] = this.getChildPaths();

    const traceData = {
      node: this,
      path,
      staticTraceData: {
        type: TraceType.ThrowArgument,
      },
      meta: {
        traceCall: 'traceThrow',
        targetPath: argPath
      }
    };

    return Traces.addTraceWithInputs(traceData, [argPath]);
  }
}