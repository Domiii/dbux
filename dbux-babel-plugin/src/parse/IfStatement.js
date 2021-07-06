// import TraceType from '@dbux/common/src/core/constants/TraceType';
import BaseNode from './BaseNode';

export default class IfStatement extends BaseNode {
  static children = ['test', 'consequent', 'alternate'];

  exit() {
    // const { path } = this;
    const [test] = this.getChildPaths();
    this.Traces.addDefaultTrace(test);
  }
}