import BaseNode from './BaseNode';

export default class ForStatement extends BaseNode {
  static children = ['init', 'test', 'update', 'body'];

  static plugins = [
    'Loop'
  ];

  exit() {
    const [init, test, update] = this.getChildPaths();
    
    this.Traces.addDefaultTraces([init, test, update]);
  }
}
