import PatternAstNodeType from '@dbux/common/src/types/constants/PatternAstNodeType';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import BaseNode from './BaseNode';
import { buildGroupNodeAst, addPatternChildNode, PatternBuildConfig } from './helpers/patterns';

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
  addPatternNode(patternCfg, prop, moreData = EmptyObject) {
    const [elementNodes] = this.getChildNodes();
    const childIndexes = [];

    // add own node
    const nodeIndex = patternCfg.addBuilder(
      buildGroupNodeAst.bind(this, childIndexes, PatternAstNodeType.Array, prop, moreData)
    );

    // add children (DFS)
    for (let i = 0; i < elementNodes.length; ++i) {
      const childNode = elementNodes[i];
      const childIdx = addPatternChildNode(patternCfg, i, childNode);
      childIndexes.push(childIdx);
    }

    return nodeIndex;
  }
}
