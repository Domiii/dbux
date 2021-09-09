// import TraceType from '@dbux/common/src/types/constants/TraceType';
import TraceType from '@dbux/common/src/types/constants/TraceType';
import { ZeroNode } from 'src/helpers/traceUtil';
import { buildTraceStatic } from 'src/instrumentation/builders/misc';
import BaseNode from './BaseNode';

export default class TryStatement extends BaseNode {
  static children = ['block', 'handler', 'finalizer'];
  static plugins = [];

  /**
   * @param {BaseNode} node
   */
  addConsequentTrace(node, traceType, traceCall) {
    const contextPlugin = this.peekPluginForce('StaticContext');
    const { contextIdVar: realContextIdVar } = contextPlugin;
    // awaitContextIdVar

    const moreTraceCallArgs = [];
    if (realContextIdVar) {
      moreTraceCallArgs.push(realContextIdVar);
    }
    else {
      // TODO: make sure that `Program` also gets a `realContextId` (contextIdVar)
      moreTraceCallArgs.push(ZeroNode);
    }
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

    if (finalizerNode) {
      this.addConsequentTrace(finalizerNode, TraceType.Finally, 'traceFinally');
    }
  }
}