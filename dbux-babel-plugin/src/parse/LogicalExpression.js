import BaseNode from './BaseNode';

export default class LogicalExpression extends BaseNode {
  static children = ['left', 'right'];
  static plugins = ['ArithmeticExpression'];

  get isNew() {
    return false;
  }
}