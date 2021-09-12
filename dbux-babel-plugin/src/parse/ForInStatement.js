import BaseNode from './BaseNode';


/**
 * NOTE: Most instrumentation comes from `VariableDeclarator`'s `ForInLValVar` plugin
 */
export default class ForInStatement extends BaseNode {
  static children = ['left', 'right', 'body'];

  static plugins = [
    'Loop'
  ];

  exit() {
    // TODO: insert trace in `body` to track write to `left` variable(s); similar to `Params`
    const [, rightNode] = this.getChildNodes();
    rightNode.addDefaultTrace();
  }
}
