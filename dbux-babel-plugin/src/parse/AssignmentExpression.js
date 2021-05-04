import BaseExpression from './BaseExpression';

export default class AssignmentExpression extends BaseExpression {
  static nodeNames = ['left', 'right'];

  exit(left, right, [leftPath, rightPath]) {
    // TODO: figure out parsing + runtime of ME first
    // TODO: add destructuring pattern support
    return {
      inputs: [this.getInput(right, rightPath)],
      outputs: [this.getOutput(left, leftPath)]
    };
  }
}