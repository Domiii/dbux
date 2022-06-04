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

  buildPatternNode(prop, patternNodes, preInitSequenceAstNodes) {
    const [elementNodes] = this.getChildNodes();
    const children = [];
    const newNode = {
      prop,
      children
    };
    patternNodes.push(newNode);

    for (let i = 0; i < elementNodes.length; ++i) {
      /**
       * @type {BaseNode}
       */
      const childNodes = elementNodes[i];
      const childPath = childNodes.path;

      let childPatternNode;
      if (childPath.isIdentifier()) {
        // Var
      }
      else if (childPath.isMemberExpression()) {
        // ME
      }
      else if (childPath.isAssignmentPattern()) {
        // TODO
      }
      else if (childPath.isRestElement()) {
        // Var or ME
      }
      else if (childPath.isPattern()) {
        childPatternNode = childNodes.buildPatternNode(i, patternNodes, preInitSequenceAstNodes);
      }

      patternNodes.push(childPatternNode);
    }
  }
}
