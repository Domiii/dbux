import BasePlugin from './BasePlugin';


class BasePatternTreeNode {
}

class PropAccessNode extends BasePatternTreeNode {
  /**
   * @type {string}
   */
  prop;
}

class WriteVarNode extends BasePatternTreeNode {
  // tid, declarationTid, inputs
  
  getValue() {
    // TODO
  }
}

class WriteMENode extends BasePatternTreeNode {
  // propValue, tid, objectTid, propTid, inputs

  getValue() {
    // TODO
  }
}

class PatternTree {
  /**
   * @type {BasePatternTreeNode}
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
    // TODO: build `PatternTree`
  }
}