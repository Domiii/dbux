import ParseNode from '../parseLib/ParseNode';

export default class UnaryExpression extends ParseNode {
  static children = ['argument'];
  static plugins = ['ArithmeticExpression'];

  addTraces() {
    const { path } = this;

    if (path.node.operator !== 'typeof') {
      super.addTraces();
    }
  }
}