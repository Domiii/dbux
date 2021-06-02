import BaseNode from './BaseNode';

export default class ArrowFunctionExpression extends BaseNode {
  static plugins = [
    'Function',
    'StaticContext'
  ];
}
