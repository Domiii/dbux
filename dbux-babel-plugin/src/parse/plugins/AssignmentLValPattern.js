import { buildAndInstrumentPatternTree } from '../helpers/patterns';
import BasePlugin from './BasePlugin';


class PatternTreeNode {
  /**
   * @type {BaseNode}
   */
  parseNode;
}

class PropPatternTraceNode extends PatternTreeNode {
  /**
   * @type {string}
   */
  prop;
}

class WriteVarNode extends PropPatternTraceNode {
  // declarationTid, inputs

  getValue() {
    // TODO
  }
}

class WriteMENode extends PropPatternTraceNode {
  // propValue, objectTid, propTid, inputs

  getValue() {
    // TODO
  }
}

/**
 * NOTE: Rest is a simpler version of spread (in that, it does not affect other indexes)
 * NOTE2: has no `prop`
 * TODO:
 * → makeSpreadableArgumentArrayCfg
 * → buildSpreadableArgArrayNoSpread
 * → 
 */
class RestNode extends PatternTreeNode {
}

export class PatternTree {
  /**
   * @type {PatternTreeNode}
   */
  root;
}

/**
 * Takes care of all patterns/pattern-likes.
 * 
 * @implements {PatternTree}
 * 
 * @see https://babeljs.io/docs/en/babel-types#patternlike
 * @see https://tc39.es/ecma262/#prod-BindingPattern
 */
export default class AssignmentLValPattern extends BasePlugin {
  instrument() {
    const { node } = this;

    const [left, right] = node.getChildNodes();
    buildAndInstrumentPatternTree(left, right.path);
  }
}
