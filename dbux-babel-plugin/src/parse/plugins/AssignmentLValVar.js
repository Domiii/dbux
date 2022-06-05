import TraceType from '@dbux/common/src/types/constants/TraceType';
import SyntaxType from '@dbux/common/src/types/constants/SyntaxType';
import { LValHolderNode } from '../_types'; 
import { buildTraceWriteVar } from '../../instrumentation/builders/misc';
import BasePlugin from './BasePlugin';
import { makeLValVarTrace } from '../helpers/lvalUtil';

export default class AssignmentLValVar extends BasePlugin {
  /**
   * @type {LValHolderNode}
   */
  node;

  exit() {
    const {
      node
    } = this;
    const { path } = node;

    // const [/* lvalNode */, valueNode] = node.getChildNodes();
    const [/* lvalPath */, rvalPath] = node.getChildPaths();

    if (!rvalPath) {
      this.error(`missing RVal node in "${this.node}"`);
      return;
    }

    if (!rvalPath.node) {
      // no write?
      return;
    }

    // console.error('assignment', !!node.isNewValue, node.isNewValue?.(), node.debugTag);

    const targetPath = path;
    const syntax = SyntaxType.AssignmentLValVar;
    /**
     * Whether this is a "computational assignment" (+= etc.)
     */
    const isNew = node.isNewValue?.() || false;
    makeLValVarTrace(node, path, targetPath, syntax, isNew, rvalPath);
  }
}