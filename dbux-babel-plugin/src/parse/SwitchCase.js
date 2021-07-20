// import TraceType from '@dbux/common/src/types/constants/TraceType';
import BaseNode from './BaseNode';

export default class SwitchCase extends BaseNode {
  static children = ['test', 'consequent'];

  exit() {
    const [test] = this.getChildPaths();
    if (test.node) {
      // case x:
      this.Traces.addDefaultTrace(test);
    }
    else {
      // default:
    }
  }
}