
import BaseNode from './BaseNode';

export default class Method extends BaseNode {
  static plugins = [
    'Function',
    'StaticContext'
  ];
}
