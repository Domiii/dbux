import { LValHolderNode } from '../_types';
import { buildTraceWriteVar } from '../../instrumentation/builders/misc';
import BasePlugin from './BasePlugin';

export default class VariableDeclaratorLVal extends BasePlugin {
  /**
   * @type {LValHolderNode}
   */
  node;

  get rvalNode() {
    const [, initNode] = this.node.getChildNodes();
    return initNode;
  }

  get hasSeparateDeclarationTrace() {
    const { path } = this.node;

    // if `var`, hoist to function scope
    // if no `initNode`, there is no write trace, so we need an independent `Declaration` trace anyway
    return path.parentPath.node.kind === 'var' || !this.rvalNode;
  }

  exit() {
    const {
      node,
      rvalNode
    } = this;
    const { path, Traces, writeTraceType } = node;

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

    const [, initPath] = this.node.getChildPaths();

    const traceData = {
      path,
      node,
      staticTraceData: {
        type: writeTraceType
      },
      meta: {
        // instrument: Traces.instrumentTraceWrite
        build: buildTraceWriteVar,
        targetPath: initPath
      }
    };

    if (path.parentPath.node.kind !== 'var') {
      traceData.scope = path.parentPath.scope; // prevent adding `tid` variable to own body,
    }

    // NOTE: `declarationTid` comes from `this.node.getDeclarationNode`
    Traces.addTraceWithInputs(traceData, [rvalNode.path]);
  }
}