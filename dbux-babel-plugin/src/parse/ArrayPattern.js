import BaseNode from './BaseNode';

/**
 * Notes:
 * 
 * * ArrayPatterns inputs are not just arrays, but can be any iterable.
 *   * -> Consider using `slicedToArray` ->
 */
export default class ArrayPattern extends BaseNode {
  static children = ['elements'];

  // /**
  //  * @see https://github.com/babel/babel/blob/672a58660f0b15691c44582f1f3fdcdac0fa0d2f/packages/babel-traverse/src/scope/index.ts#L631
  //  */
  // insertSlicedToArray() {
  //   const args = [targetNode];
  //   t.callExpression(this.hub.addHelper('slicedToArray'), args);
  // }

  enter() {
    // TODO!
    this.path.skip();
  }
}
