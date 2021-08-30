// import TraceType from '@dbux/common/src/types/constants/TraceType';
import TraceType from '@dbux/common/src/types/constants/TraceType';
import { buildTraceNoValue } from 'src/instrumentation/builders/misc';
import { instrumentUnshiftBody } from 'src/instrumentation/instrumentMisc';
import BaseNode from './BaseNode';

export default class TryStatement extends BaseNode {
  static children = ['block', 'handler', 'finalizer'];
  static plugins = [];

  /**
   * 
   */
  exit1() {
    const { path } = this;
    const [, , finalizerNode] = this.getChildNodes();

    if (finalizerNode) {
      const staticContext = this.peekPluginForce('StaticContext');
      const { contextIdVar } = staticContext;

      const traceData = {
        path,
        node: this,
        staticTraceData: {
          type: TraceType.Finally
        },
        meta: {
          instrument: instrumentUnshiftBody,
          build: buildTraceNoValue,
          traceCall: 'traceFinally',
          moreTraceCallArgs: [contextIdVar]
        }
      };

      finalizerNode.Traces.addTrace(traceData);
    }
  }
}