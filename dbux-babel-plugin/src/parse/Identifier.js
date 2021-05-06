import BaseExpression from './BaseExpression';


export default class Identifier extends BaseExpression {
  enter(path, state) {
    const fun = this.stack.getNode('Function');
    
  }
}