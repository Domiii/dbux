import BaseNode from './BaseNode';

export default class ForStatement extends BaseNode {
  static children = ['init', 'test', 'update', 'body'];

  static plugins = [
    'Loop'
  ];

  exit() {
    const [init, test, update] = this.getChildPaths();
    
    // TODO: all tid variable declarations from these three children need to be moved to `scope.getFunctionParent() || scope.getProgramParent()`
    // TODO: merge decl + write, of `init` variables, if they are not `var`
    

    this.Traces.addDefaultTraces([test, update]);
  }
}
