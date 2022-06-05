import BaseNode from './BaseNode';
import { buildPatternChildTraceCfg, PatternBuildConfig } from './helpers/patterns';

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

  /**
   * @param {PatternBuildConfig} patternCfg
   * @param {BaseNode} node
   */
  buildPatternTraceCfg(patternCfg, prop) {
    const { lvalNodeTraceCfgs } = patternCfg;
    const [elementNodes] = this.getChildNodes();
    const children = [];
    const newNode = TODO {
      prop,
      children
    };
    lvalNodeTraceCfgs.push(newNode);

    for (let i = 0; i < elementNodes.length; ++i) {
      const childNode = elementNodes[i];
      buildPatternChildTraceCfg(patternCfg, i, childNode);
      lvalNodeTraceCfgs.push(childNode);
    }
  }
}
