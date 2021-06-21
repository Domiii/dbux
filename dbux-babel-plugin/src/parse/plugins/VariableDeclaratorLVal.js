import { LValHolderNode } from '../_types';
import { buildTraceWriteVar } from '../../instrumentation/builders/misc';
import BasePlugin from './BasePlugin';

export default class VariableDeclaratorLVal extends BasePlugin {
  /**
   * @type {LValHolderNode}
   */
  node;

  get rvalNode() {
    const [, initNode] = this.getChildNodes();
    return initNode;
  }

  get hasSeparateDeclarationTrace() {
    const { path } = this;

    // if `var`, hoist to function scope
    // if no `initNode`, there is no write trace, so we need an independent `Declaration` trace anyway
    return path.parentPath.node.kind === 'var' || !this.rvalNode;
  }

  exit() {
    const {
      node,
      rvalNode
    } = this;
    const { Traces, writeTraceType } = node;

    if (!rvalNode) {
      this.error(`missing RVal node in "${this.node}"`);
      return;
    }

    if (!writeTraceType) {
      this.error(`missing writeTraceType in "${this.node}"`);
      return;
    }

    if (!rvalNode.path.node) {
      // no write
      return;
    }

    const traceData = {
      staticTraceData: {
        type: writeTraceType
      },
      meta: {
        // instrument: Traces.instrumentTraceWrite
        build: buildTraceWriteVar
      }
    };

    this.node.decorateWriteTraceData(traceData);

    // NOTE: `declarationTid` comes from `this.node.getDeclarationNode`
    Traces.addTraceWithInputs(traceData, [rvalNode.path]);
  }
}