import { LValHolderNode } from '../_types';
import AssignmentLValPattern from './AssignmentLValPattern';
import BasePlugin from './BasePlugin';

export default class DeclaratorLValPattern extends AssignmentLValPattern {
  /**
   * @type {LValHolderNode}
   */
  node;

  get isDeclarator() {
    return true;
  }

  get isHoisted() {
    const { path } = this.node;
    return path.parentPath.node.kind === 'var';
  }

  get rvalNode() {
    const [, initNode] = this.node.getChildNodes();
    return initNode;
  }

  get hasSeparateDeclarationTrace() {
    return this.isHoisted;
  }

  getVariableLvalNodeByName(name) {
    return this.patternCfg.lvalVarNodesByName.get(name);
  }
}