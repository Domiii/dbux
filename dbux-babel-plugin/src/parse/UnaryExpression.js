import BaseNode from './BaseNode';
import { pickPlugin } from './helpers/pluginUtil';



const ArgumentPlugins = {
  // `delete` -> traceDeleteME
  delete: 'Delete'
  
  // TODO: `typeof` targets a `BindingIdentifier`
  // other special operators: `void`
};

/**
 * @see https://babeljs.io/docs/en/babel-types#unaryexpression
 */
export default class UnaryExpression extends BaseNode {
  static children = ['argument'];
  static plugins = [
    function (node) {
      const key = node.path.node.operator;
      if (ArgumentPlugins[key]) {
        return pickPlugin(node, key, ArgumentPlugins);
      }
      return 'ArithmeticExpression';
    }
  ];
}