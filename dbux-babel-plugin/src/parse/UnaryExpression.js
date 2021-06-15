import BaseNode from './BaseNode';

/**
 * @see https://babeljs.io/docs/en/babel-types#unaryexpression
 */
export default class UnaryExpression extends BaseNode {
  static children = ['argument'];
  static plugins = ['ArithmeticExpression'];

  // TODO: `delete` -> writeME(undefined); returns `true` if argument is valid (e.g. `delete o.x`); `false` if not (e.g. `delete o`).

  // other special operators: `typeof`, `void`
}