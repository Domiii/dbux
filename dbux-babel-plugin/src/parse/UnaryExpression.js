import BaseArithmeticExpression from './BaseArithmeticExpression';

export default class LogicalExpression extends BaseArithmeticExpression {
  static nodes = ['left', 'right'];
}