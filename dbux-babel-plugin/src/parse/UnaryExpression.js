import ParseNode from '../parseLib/ParseNode';

export default class UnaryExpression extends ParseNode {
  static children = ['argument'];
  static plugins = ['ArithmeticExpression'];

  // TODO: `delete` -> writeME(undefined)

  // other special operators: `typeof`, `void`
}