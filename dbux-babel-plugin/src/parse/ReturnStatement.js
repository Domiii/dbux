import BaseNode from './BaseNode';


export default class ReturnStatement extends BaseNode {
  static children = [];

  // TODO: also make sure that `Function.exit` traces things correctly when it adds a new `return` statement
}