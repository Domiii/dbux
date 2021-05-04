import BaseNode from './BaseNode';

export default class AssignmentExpression extends BaseNode {
  static nodeNames = ['left', 'right'];

  exit(left, right, [leftPath, rightPath]) {
    // TODO: very similar to `AssignmentExpression` but not an expression
  }
}