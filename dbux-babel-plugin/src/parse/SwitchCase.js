// import TraceType from '@dbux/common/src/types/constants/TraceType';
import BaseNode from './BaseNode';

export default class SwitchCase extends BaseNode {
  static children = ['test', 'consequent'];

  exit() {
    const [test] = this.getChildPaths();
    if (test.node) {
      // i.e. `case x:`
      const testTrace = this.Traces.addDefaultTrace(test);
      // testTrace.staticTraceData.controlId = testTrace.inProgramStaticTraceId;
      // testTrace.staticTraceData.controlGroupId = TODO;
    }
    else {
      // i.e. `default:`
      // TODO: controlId
    }
  }
}
