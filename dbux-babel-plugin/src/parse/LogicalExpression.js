import BaseArithmeticExpression from './BaseArithmeticExpression';

export default class UnaryExpression extends BaseArithmeticExpression {
  static nodes = ['argument'];
}