import { LValHolderNode } from '../_types';
import BasePlugin from './BasePlugin';

export default class ForDeclaratorLVal extends BasePlugin {
  /**
   * @type {LValHolderNode}
   */
  node;

  get rvalNode() {
    const forInNode = this.node.peekNodeForce('ForInStatement');
    const [, rightNode] = forInNode.getChildNodes();
    return rightNode;
  }

  get hasSeparateDeclarationTrace() {
    return this.isHoisted;
  }

  exit() {
    // TODO: see `ForOfStatement` for `params` solution
    // NOTE: there is no tracing of the lval itself.
    //    Instead, we handle the iterator variable similar to parameters.

    // const {
    //   node,
    //   rvalNode
    // } = this;
    // const { Traces, writeTraceType } = node;

    // if (!writeTraceType) {
    //   this.error(`missing writeTraceType in "${this.node}"`);
    //   return;
    // }

    // const [lvalPath] = this.node.getChildPaths();

    // rvalNode.addDefaultTrace();

    // const traceData = {
    //   path: lvalPath,
    //   node,
    //   staticTraceData: {
    //     type: TraceType.ExpressionResult
    //   },
    //   meta: {
    //     traceCall: 'traceForIn',
    //     build: buildTraceExpressionVar,
    //     targetPath: rvalNode.path
    //   }
    // };

    // // NOTE: `declarationTid` comes from `this.node.getDeclarationNode`
    // const traceCfg = Traces.addTrace(traceData);

    // // we need the inProgramStaticTraceId to generate one trace per iteration
    // traceCfg.meta.moreTraceCallArgs = [t.numericLiteral(traceCfg.inProgramStaticTraceId)];
  }
}