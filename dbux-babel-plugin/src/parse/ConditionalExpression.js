import BaseNode from './BaseNode';

export default class ConditionalExpression extends BaseNode {
  static children = ['test', 'consequent', 'alternate'];

  exit() {
    const childPaths = this.getChildPaths();
    this.Traces.addDefaultTraces(childPaths);
  }
}