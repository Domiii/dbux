import BaseNode from './BaseNode';

export default class WhileStatement extends BaseNode {
  static children = ['test', 'body'];

  static plugins = [
    'Loop'
  ];
}
