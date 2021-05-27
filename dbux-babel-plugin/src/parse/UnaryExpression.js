import ArithmeticExpression from './plugins/ArithmeticExpression';

export default class UnaryExpression extends ArithmeticExpression {
  static children = ['argument'];
  static plugins = ['ArithmeticExpression'];

  addTraces() {
    const { path } = this;

    if (path.node.operator !== 'typeof') {
      super.addTraces();
    }
  }
}