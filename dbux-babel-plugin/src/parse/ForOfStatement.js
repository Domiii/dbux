import BaseNode from './BaseNode';

export default class ForOfStatement extends BaseNode {
  static children = ['left', 'right', 'body'];

  static plugins = [
    'Loop'
  ];
}
