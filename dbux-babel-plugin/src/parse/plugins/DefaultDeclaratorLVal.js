import { LValHolderNode } from '../_types';
import { buildTraceWriteVar } from '../../instrumentation/builders/misc';
import BasePlugin from './BasePlugin';
import { makeDeclarationVarStaticTraceData } from '../BindingIdentifier';
import { addLValVarTrace } from '../helpers/lvalUtil';

export default class DefaultDeclaratorLVal extends BasePlugin {
  /**
   * hackfix: add type for {@link BasePlugin#node}
   * 
   * @type {LValHolderNode}
   */
  node;

  get isHoisted() {
    const { path } = this.node;
    return path.parentPath.node.kind === 'var';
  }

  get rvalNode() {
    const [, initNode] = this.node.getChildNodes();
    return initNode;
  }

  get hasSeparateDeclarationTrace() {
    // if `var`: hoist to function scope.
    // if no `initNode`: there is no write trace, so `Declaration` is independent.
    return this.isHoisted || !this.rvalNode;
  }

  exit() {
    const {
      node,
      rvalNode
    } = this;
    const { path, writeTraceType } = node;

    if (!writeTraceType) {
      this.error(`missing writeTraceType in "${this.node}"`);
      return;
    }

    if (!rvalNode) {
      // no write
      return;
    }

    const [idPath, initPath] = this.node.getChildPaths();

    // NOTE: `declarationTid` comes from `this.node.getDeclarationNode`
    const targetPath = initPath;

    const traceData = {
      staticTraceData: makeDeclarationVarStaticTraceData(idPath)
    };

    if (!this.isHoisted) {
      // hackfix for `ForStatement.init`: prevent adding `tid` variable to own body
      traceData.scope = path.parentPath.scope;
    }

    addLValVarTrace(node, path, writeTraceType, targetPath, rvalNode.path, traceData);
  }
}
