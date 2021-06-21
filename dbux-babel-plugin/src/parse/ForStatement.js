import BaseNode from './BaseNode';

export default class ForStatement extends BaseNode {
  static children = ['init', 'test', 'update', 'body'];

  static plugins = [
    'Loop'
  ];

  exit() {
    const [test, update] = this.getChildPaths();
    
    
    // TODO: all tid variable declarationTids from `init` need to be inlined
    // TODO: merge decl + write, of `init` variables, if they are not `var`
    

    this.Traces.addDefaultTraces([test, update]);
  }
}
