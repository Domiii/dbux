import BaseArithmeticExpression from './BaseArithmeticExpression';

export default class BinaryExpression extends BaseArithmeticExpression {
  static nodes = ['left', 'right'];

  exit(left, right) {
    
  }
}