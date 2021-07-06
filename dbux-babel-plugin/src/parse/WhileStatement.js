import BaseNode from './BaseNode';

export default class WhileStatement extends BaseNode {
  static children = ['test', 'body'];

  static plugins = [
    'Loop'
  ];

  exit() {
    // const { path } = this;
    const [test] = this.getChildPaths();
    this.Traces.addDefaultTrace(test);
  }
}
