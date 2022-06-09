import PatternAstNodeType from '@dbux/common/src/types/constants/PatternAstNodeType';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { pathToString } from '../helpers/pathHelpers';
import BaseNode from './BaseNode';
import { buildGroupNodeAst, addPatternChildNode, PatternBuildConfig } from './helpers/patterns';


/**
 * Notes:
 * 
 * * Private names cannot be destructured (limited to `LiteralPropertyName` - https://tc39.es/ecma262/#prod-LiteralPropertyName)
 * * 
 */
export default class ObjectPattern extends BaseNode {
  static children = ['properties'];

  handleComputedProp() {
    // NOTE: one problem is that rval is evaluated before lval props (its different order for id var declarators)
    //  → see `pattern-CONFUSED.js` sample
    // TODO!
  }

  /**
   * @param {PatternBuildConfig} patternCfg
   * @param {BaseNode} node
   */
  addPatternNode(patternCfg, prop, moreData = EmptyObject) {
    const [propertyNodes] = this.getChildNodes();
    const childIndexes = [];

    // add own node
    const nodeIndex = patternCfg.addBuilder(
      buildGroupNodeAst.bind(this, childIndexes, PatternAstNodeType.Object, prop, moreData)
    );

    // add children (DFS)
    for (let i = 0; i < propertyNodes.length; ++i) {
      const childNode = propertyNodes[i];
      const keyAstNode = childNode.path.node.key;
      if (keyAstNode.computed && this.state.verbose.nyi) {
        // TODO: add prop to preInitNodeBuilders, then insert `propertyVar` here
        this.warn(`[NYI] object pattern has computed key: ${pathToString(childNode.path.node)}`);
        throw new Error(`object pattern with computed key found - cannot continue`);
      }
      const childProp = keyAstNode.name;
      const [, valueNode] = childNode.getChildNodes();
      const childIdx = addPatternChildNode(patternCfg, childProp, valueNode);
      childIndexes.push(childIdx);
    }

    return nodeIndex;
  }
}
