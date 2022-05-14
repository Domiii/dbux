import EmptyArray from '@dbux/common/src/util/EmptyArray';
import BaseNode from './BaseNode';
import { pickPlugin } from './helpers/pluginUtil';



const ArgumentPluginsByOperator = {
  /**
   * Delete has its own tracing implementation.
   * Does not trace argument.
   */
  delete: 'Delete'

  // other special operators: `void`
};

const untracedArgumentOperators = new Set([
  /**
   * Disable default trace for `typeof`.
   * NOTE: `typeof` operand is `BindingIdentifier`.
   */
  'typeof'
]);

/**
 * @see https://babeljs.io/docs/en/babel-types#unaryexpression
 */
export default class UnaryExpression extends BaseNode {
  static children = ['argument'];
  static plugins = [
    function (node) {
      const { operator } = node.path.node;
      if (operator in ArgumentPluginsByOperator) {
        return pickPlugin(node, operator, ArgumentPluginsByOperator);
      }
      return 'ArithmeticExpression';
    }
  ];

  get operator() {
    return this.path.node.operator;
  }

  getDefaultChildPaths() {
    const { operator } = this.path.node;
    if (untracedArgumentOperators.has(operator)) {
      return EmptyArray;
    }
    return super.getDefaultChildPaths();
  }
}