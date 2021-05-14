import BaseNode from './BaseNode';

export default class UnaryExpression extends BaseNode {
  static children = ['argument'];
  static plugins = ['ArithmeticExpression'];
}