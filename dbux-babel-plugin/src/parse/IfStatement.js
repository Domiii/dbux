// import TraceType from '@dbux/common/src/types/constants/TraceType';
import BaseNode from './BaseNode';

export default class IfStatement extends BaseNode {
  static children = ['test', 'consequent', 'alternate'];
  static plugins = ['ControlBlock'];

  exit() {
    // const { path } = this;
    const [test] = this.getChildPaths();

    const testTrace = this.Traces.addDefaultTrace(test);
    testTrace.staticTraceData.controlId = testTrace.inProgramStaticTraceId;
    // testTrace.staticTraceData.controlGroupId = TODO;
  }
}