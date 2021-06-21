import { LValHolderNode } from '../_types';
import { buildTraceWriteVar } from '../../instrumentation/builders/misc';
import BasePlugin from './BasePlugin';

export default class ForInLValVar extends BasePlugin {
  /**
   * @type {LValHolderNode}
   */
  node;

  get rvalNode() {
    const forInNode = this.node.stack.peekNode('ForInStatement');
    const [, rightNode] = forInNode.getChildNodes();
    return rightNode;
  }

  get hasSeparateDeclarationTrace() {
    const { path } = this;
    // const [, initNode] = this.getChildNodes();

    // if `var`, hoist to function scope
    return path.parentPath.node.kind === 'var';
  }

  exit() {
    const {
      node,
      rvalNode
    } = this;
    const { Traces, writeTraceType } = node;

    if (!writeTraceType) {
      this.error(`missing writeTraceType in "${this.node}"`);
      return;
    }

    const traceData = {
      staticTraceData: {
        type: writeTraceType
      },
      meta: {
        // TODO: wrap iterator, to record DataNodes for all types of iterator access
        // traceCall: 'writeWrapIterator',
        build: buildTraceWriteVar
      }
    };

    this.node.decorateWriteTraceData(traceData);

    // NOTE: `declarationTid` comes from `this.node.getDeclarationNode`
    Traces.addTraceWithInputs(traceData, [rvalNode.path]);
  }
}