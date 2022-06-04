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
  enter() {
    const {
      node: {
        stack
      }
    } = this;

    if (!stack.specialNodes.patternTree) {
      stack.specialNodes.patternTree = this;
    }
  }

  exit1() {
    const {
      node: {
        stack
      }
    } = this;

    if (stack.specialNodes.patternTree === this) {
      stack.specialNodes.patternTree = null;
    }
  }

  instrument() {
    /**
     * Cases:
     * 1. AssignmentExpression
     * 2. DefaultDeclaratorLVal (adds `Write` trace, while VariableDeclarator might add a hoisted `Declaration` trace)
     * 3. Params
     * 4. ForDeclaratorLVal (will probably use `Params` logic)
     */

    // TODO: replace rval with `tracePattern(tree, rvalTid, rval)`
    // TODO: the `tracePattern` function returns a reconstruction of the rval, so the lval does not need changing
  }
}
