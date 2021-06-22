import * as t from '@babel/types';
import TraceType from '@dbux/common/src/core/constants/TraceType';
import { LValHolderNode } from '../_types';
import { buildTraceExpressionVar, buildTraceWriteVar } from '../../instrumentation/builders/misc';
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
        type: TraceType.ExpressionResult
      },
      meta: {
        traceCall: 'traceForIn',
        build: buildTraceExpressionVar
      }
    };

    this.node.decorateWriteTraceData(traceData);

    // NOTE: `declarationTid` comes from `this.node.getDeclarationNode`
    const traceCfg = Traces.addTraceWithInputs(traceData, [rvalNode.path]);

    // we need the inProgramStaticTraceId to generate one trace per iteration
    traceCfg.meta.moreTraceCallArgs = [t.numericLiteral(traceCfg.inProgramStaticTraceId)];
  }
}