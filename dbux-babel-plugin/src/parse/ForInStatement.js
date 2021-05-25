import BaseNode from './BaseNode';

export default class ForInStatement extends BaseNode {
  static children = ['left', 'right', 'body'];

  static plugins = [
    'Loop'
  ];
}
