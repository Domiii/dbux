// import TraceType from '@dbux/common/src/types/constants/TraceType';
import TraceType from '@dbux/common/src/types/constants/TraceType';
import { buildTraceStatic } from 'src/instrumentation/builders/misc';
import BaseNode from './BaseNode';

export default class TryStatement extends BaseNode {
  static children = ['block', 'handler', 'finalizer'];
  static plugins = [];

  /**
   * @param {BaseNode} node
   */
  addConsequentTrace(node, traceType, traceCall) {
    const staticContext = this.peekPluginForce('StaticContext');
    const { contextIdVar: realContextIdVar } = staticContext;
    // awaitContextIdVar

    const moreTraceCallArgs = [realContextIdVar];
    const contextPlugin = this('StaticContext');
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