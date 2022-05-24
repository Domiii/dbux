// import TraceType from '@dbux/common/src/types/constants/TraceType';
import TraceType from '@dbux/common/src/types/constants/TraceType';
import { ZeroNode } from '../helpers/traceUtil';
import { buildTraceStatic } from '../instrumentation/builders/misc';
import { buildTraceId } from '../instrumentation/builders/traceId';
import { insertAfterBody } from '../instrumentation/instrumentMisc';
import BaseNode from './BaseNode';
import StaticContext from './plugins/StaticContext';

export default class TryStatement extends BaseNode {
  static children = ['block', 'handler', 'finalizer'];
  static plugins = [];

  /**
   * NOTE: adds `contextIdVar` to traceCall.
   * 
   * @param {BaseNode} node
   */
  addConsequentStartTrace(node, traceType, traceCall) {
    const realContextIdVar = this.getRealContextIdVar();

    const moreTraceCallArgs = [];
    if (realContextIdVar) {
      moreTraceCallArgs.push(realContextIdVar);
    }
    else {
      // TODO: make sure that `Program` also gets a `realContextId` (contextIdVar)
      moreTraceCallArgs.push(ZeroNode);
    }

    // add `awaitContextId` to trace call args (if is async function)
    this.StaticContext.addInterruptableContextArgs(moreTraceCallArgs);

    const traceData = {
      path: node.path,
      node,
      staticTraceData: {
        type: traceType
      },
      meta: {
        noTidIdentifier: true,
        hoisted: true,    // add to beginning of block
        // instrument: instrumentUnshiftBody,
        build: buildTraceStatic,
        traceCall,
        moreTraceCallArgs
      }
    };

    return node.Traces.addTrace(traceData);
  }

  addConsequentExitTrace(node, traceType, traceCall = 'newTraceId') {
    return this.Traces.addTrace({
      path: node.path,
      node,
      staticTraceData: {
        type: traceType
      },
      meta: {
        // we don't want the variable
        noTidIdentifier: true,
        instrument: insertAfterBody,
        // build: buildTraceId
        build: buildTraceStatic,
        traceCall
      }
    });
  }

  /**
   * 
   */
  exit1() {
    const [, , finalizerNode] = this.getChildNodes();
    const [tryPath] = this.getChildPaths();

    /**
     * Add `TryExit` to the end of `try` block.
     */
    this.Traces.addTrace({
      path: tryPath,
      node: this,
      staticTraceData: {
        type: TraceType.TryExit
      },
      meta: {
        noTidIdentifier: true,
        instrument: insertAfterBody,
        // build: buildTraceId // we don't want the variable
        build: buildTraceStatic,
        traceCall: 'newTraceId'
      }
    });

    if (finalizerNode) {
      const traceCall = this.StaticContext.isInterruptable ? 'traceFinallyInterruptable' : 'traceFinally';
      this.addConsequentStartTrace(finalizerNode, TraceType.Finally, traceCall);
      this.addConsequentExitTrace(finalizerNode, TraceType.FinallyExit);
    }
  }
}