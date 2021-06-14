import BaseNode from './BaseNode';

export default class DoWhileStatement extends BaseNode {
  static children = ['test', 'body'];

  static plugins = [
    'Loop'
  ];

  exit() {
    const [test] = this.getChildPaths();
    this.Traces.addDefaultTrace(test);
  }
}
