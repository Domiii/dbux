import BaseNode from './BaseNode';

/**
 * NOTE: Most instrumentation comes from `ForInLValVar` plugin
 */
export default class ForInStatement extends BaseNode {
  static children = ['left', 'right', 'body'];

  static plugins = [
    'Loop'
  ];

  // exit() {
    
  // }
}
