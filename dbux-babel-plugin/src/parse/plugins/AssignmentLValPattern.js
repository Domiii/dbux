import BasePlugin from './BasePlugin';


class PatternTreeNode {
  tid;
}

class PropPatternTraceNode {
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

class PatternTree {
  /**
   * @type {PatternTreeNode}
   */
  root;
}

export default class AssignmentLValPattern extends BasePlugin {
  /**
   * @type {PatternTree}
   */
  patternTree;

  enter() {

  }

  exit() {
    // TODO: 
    // 1. build `PatternTree`
  }

  instrument() {
    // TODO: replace rval with `tracePattern(tree, rvalTid, rval)`
    //    → in `tracePattern`, return a reconstruction of the rval, so the lval does not need changing
  }
}