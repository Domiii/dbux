import BaseNode from './BaseNode';

export default class VariableDeclarator extends BaseNode {
  static nodeNames = ['id', 'init'];

  exit(id, init, [idPath, initPath]) {
    // creates a new binding
    // TODO: very similar to `AssignmentExpression` but not an expression
  }
}