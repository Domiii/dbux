import BaseNode from './BaseNode';

export default class VariableDeclarator extends BaseNode {
  static plugins = ['BindingNode'];

  static children = ['id', 'init'];

  exit(id, init, [idPath, initPath]) {
    // creates a new binding
    // TODO: very similar to `AssignmentExpression` but not an expression
  }

  instrument() {
    // TODO: wrap rval in td(rval, tid)
  }
}