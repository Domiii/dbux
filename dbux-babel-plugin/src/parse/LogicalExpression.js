import BaseNode from './BaseNode';

export default class LogicalExpression extends BaseNode {
  static children = ['left', 'right'];
  static plugins = ['ArithmeticExpression'];

  // TODO: this actually passes on one of the input values
  // TODO: when fixing this, apply same fix to ConditionalExpression
  // get isNew() {
  //   return false;
  // }

  get operator() {
    return this.path.node.operator;
  }
}