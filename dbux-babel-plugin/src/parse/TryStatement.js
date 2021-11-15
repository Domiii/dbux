// import TraceType from '@dbux/common/src/types/constants/TraceType';
import TraceType from '@dbux/common/src/types/constants/TraceType';
import { ZeroNode } from '../helpers/traceUtil';
import { buildTraceStatic } from '../instrumentation/builders/misc';
import { buildTraceId } from '../instrumentation/builders/traceId';
import { instrumentBehind } from '../instrumentation/instrumentMisc';
import BaseNode from './BaseNode';
import StaticContext from './plugins/StaticContext';

export default class TryStatement extends BaseNode {
  static children = ['block', 'handler', 'finalizer'];
  static plugins = [];

  /**
   * @param {BaseNode} node
   */
  addConsequentTrace(node, traceType, traceCall) {
    /**
     * @type {StaticContext}
     */
    const contextPlugin = this.peekPluginForce('StaticContext');
    const { contextIdVar: realContextIdVar } = contextPlugin;

    const moreTraceCallArgs = [];
    if (realContextIdVar) {
      moreTraceCallArgs.push(realContextIdVar);
    }
    else {
      // TODO: make sure that `Program` also gets a `realContextId` (contextIdVar)
      moreTraceCallArgs.push(ZeroNode);
    }

    // add `awaitContextId` to trace call args (if is async function)
    contextPlugin.addAwaitContextIdVarArg(moreTraceCallArgs);

    const traceData = {
      path: node.path,
      node,
      staticTraceData: {
        type: traceType
      },
      meta: {
        noTidIdentifier: true,
        hoisted: true,
        // instrument: instrumentUnshiftBody,
        build: buildTraceStatic,
        traceCall,
        moreTraceCallArgs
      }
    };

    return node.Traces.addTrace(traceData);
  }

  /**
   * 
   */
  exit1() {
    const [, , finalizerNode] = this.getChildNodes();
    const [tryPath] = this.getChildPaths();

    /**
     * Add `TryBlockExit` to the end of `try` block.
     */
    this.Traces.addTrace({
      path: tryPath,
      node: this,
      staticTraceData: {
        type: TraceType.TryBlockExit
      },
      meta: {
        traceCall: 'newTraceId',
        noTidIdentifier: true,
        instrument: instrumentBehind,
        // build: buildTraceId // we don't want the variable
        build: buildTraceStatic
      }
    });

    if (finalizerNode) {
      this.addConsequentTrace(finalizerNode, TraceType.Finally, 'traceFinally');
    }
  }
}