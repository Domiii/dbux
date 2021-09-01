import SpecialIdentifierType from '@dbux/common/src/types/constants/SpecialIdentifierType';
import SpecialObjectType from '@dbux/common/src/types/constants/SpecialObjectType';
import { isTraceFunctionExit, isTracePop, isTraceThrow } from '@dbux/common/src/types/constants/TraceType';
import Trace from '@dbux/common/src/types/Trace';
import Collection from '../Collection';

/** @typedef { import("./ExecutionContextCollection").default } ExecutionContextCollection */

/**
 * @extends {Collection<Trace>}
 */
export default class TraceCollection extends Collection {
  lastContextId = -1;
  lastCodeChunkId = 0;

  constructor(dp) {
    super('traces', dp);
  }

  add(traces) {
    // set applicationId
    for (const trace of traces) {
      trace.applicationId = this.dp.application.applicationId;
    }

    // debug(`traces`, JSON.stringify(traces, null, 2));

    super.add(traces);
  }

  serialize(trace) {
    const traceData = { ...trace };
    delete traceData._valueString;
    delete traceData._valueStringShort;

    // these properties will be resolved on addData, don't need to store them
    delete traceData.applicationId;
    delete traceData.codeChunkId;
    delete traceData.staticTraceIndex;
    return traceData;
  }

  /**
   * Post processing of trace data
   * @param {Trace[]} traces
   */
  postAddRaw(traces) {
    // build dynamic call expression tree
    this.errorWrapMethod('registerResultId', traces);
    this.errorWrapMethod('registerValueRefSpecialObjectType', traces);
    // this.errorWrapMethod('resolveCodeChunks', traces);
    this.errorWrapMethod('resolveCallIds', traces);
    this.errorWrapMethod('resolveErrorTraces', traces);
  }

  postIndexRaw(traces) {
    this.errorWrapMethod('resolveMonkeyParams', traces);
  }

  registerResultId(traces) {
    for (const { traceId, resultCallId } of traces) {
      if (resultCallId) {
        const bceTrace = this.dp.collections.traces.getById(resultCallId);
        bceTrace.resultId = traceId;
      }
    }
  }

  registerValueRefSpecialObjectType(traces) {
    for (const trace of traces) {
      const { traceId, staticTraceId, nodeId } = trace;
      const staticTrace = this.dp.collections.staticTraces.getById(staticTraceId);
      const specialType = staticTrace.data?.specialType;
      if (SpecialObjectType.hasValue(specialType)) {
        const dataNode = this.dp.collections.dataNodes.getById(nodeId);
        const valueRef = dataNode && this.dp.collections.values.getById(dataNode.refId);
        if (valueRef) {
          // hackfix: edit-after-store (usually we try to avoid changes to data that was stored earlier)
          valueRef.specialObjectType = specialType;
        }
        else {
          const traceInfo = this.dp.util.makeTraceInfo(traceId);
          // eslint-disable-next-line max-len
          this.logger.warn(`Cannot register SpecialObjectType.${SpecialObjectType.nameFrom(specialType)} (${specialType}) for Argument trace: valueRef not found. trace: ${traceInfo}, dataNode: ${dataNode}`);
        }
      }
    }
  }

  // resolveCodeChunks(traces) {
  //   for (const trace of traces) {
  //     const {
  //       contextId
  //     } = trace;

  //     const context = this.dp.collections.executionContexts.getById(contextId);
  //     const { staticContextId } = context;

  //     // codeChunkId
  //     // if (contextId !== this.dp.lastContextId) {
  //     //   // new code chunk
  //     //   ++this.lastCodeChunkId;
  //     //   this.lastContextId = contextId;
  //     // }
  //     // trace.codeChunkId = this.lastCodeChunkId;

  //     // TODO: split + organize code chunks along "deep splits"?
  //     // TODO: how to re-split an already established chunk?
  //     trace.codeChunkId = staticContextId;
  //   }
  // }

  logCallResolveError(traceId, staticTrace, beforeCall, beforeCalls) {
    const stackInfo = beforeCalls.map(t => t &&
      `#${t?.staticTraceId} ${this.dp.collections.staticTraces.getById(t.staticTraceId)?.displayName || '(no staticTrace found)'}` ||
      '(null)');

    // eslint-disable-next-line max-len
    this.logger.error(`Could not resolve resultCallId for trace #${staticTrace.staticTraceId} "${staticTrace.displayName}" (traceId ${traceId}). resultCallId ${staticTrace.resultCallId} not matching beforeCall.staticTraceId #${beforeCall?.staticTraceId || 'NA'}. BCE Stack:\n  ${stackInfo.join('\n  ')}`);
  }

  resolveCallIds(traces) {
    for (const trace of traces) {
      const { traceId: callId } = trace;

      const argTraces = this.dp.util.getCallArgTraces(callId);
      if (argTraces) {
        // BCE
        argTraces.forEach(t => t.callId = callId);
      }
    }
  }

  /**
   * Link arg <-> param DataNodes of monkey-patched builtin functions.
   * For normal functions, consider {@link ExecutionContextCollection#setParamInputs}
   */
  resolveMonkeyParams(traces) {
    for (const trace of traces) {
      const { traceId: callId, data } = trace;
      const monkey = data?.monkey;
      if (monkey?.wireInputs) {
        // NOTE: function is monkey patched, and generated it's own set of ("monkey") `DataNode`s, one per argument

        // monkeyDataNodes are attached to `BCE` (because result trace is not available while monkey'ing)
        const monkeyDataNodes = this.dp.util.getDataNodesOfTrace(callId);

        // get `argDataNodes` (flattened, in case of spread)
        const argDataNodes = this.dp.util.getCallArgDataNodes(callId);

        if (!monkeyDataNodes || !argDataNodes) {
          continue;
        }

        // wire monkey <-> arg DataNodes (should be 1:1)
        for (let i = 0; i < monkeyDataNodes.length; i++) {
          const monkeyDataNode = monkeyDataNodes[i];
          const argDataNode = argDataNodes[i];

          // set argument nodes as input nodes for monkey result nodes
          // NOTE: argDataNode might be missing (e.g. because it had a "dbux disable" instruction)
          argDataNode && (monkeyDataNode.inputs = [argDataNode.nodeId]);
        }
      }
    }
  }

  resolveErrorTraces(traces) {
    let errorTraces;
    try {
      for (const trace of traces) {
        const {
          traceId,
          contextId,
          previousTrace: previousTraceId
        } = trace;

        // if traces were disabled, there is nothing to do here
        if (!this.dp.util.isContextTraced(contextId)) {
          continue;
        }

        const traceType = this.dp.util.getTraceType(traceId);
        if (!isTracePop(traceType) || !previousTraceId) {
          // only (certain) pop traces can generate errors
          continue;
        }

        const staticContext = this.dp.util.getTraceStaticContext(traceId);
        if (staticContext.isInterruptable) {
          // NOTE: interruptable contexts only have `Push` and `Pop` traces.
          //    Everything else (including error handling!) is in `Resume` children.
          continue;
        }

        const previousTraceType = this.dp.util.getTraceType(previousTraceId);
        if (!isTraceFunctionExit(previousTraceType)) {
          // before pop must be a function exit trace, else -> error!
          trace.error = true;

          errorTraces = errorTraces || [];
          errorTraces.push(trace);

          // guess error trace
          const previousTrace = this.dp.collections.traces.getById(previousTraceId);
          const { staticTraceId, callId, resultCallId } = previousTrace;
          if (isTraceThrow(previousTraceType)) {
            // trace is `throw`
            trace.staticTraceId = staticTraceId;
          }
          else if (callId) {
            // participates in a call but call did not finish -> set expected error trace to BCE
            const callTrace = this.dp.collections.traces.getById(callId);
            if (callTrace.resultId) {
              // strange...
              this.logger.error('last (non-result) call trace in error context has `resultId`', callTrace.resultId, callTrace);
            }
            else {
              // the call trace caused the error
              // trace.staticTraceId = callTrace.staticTraceId;
            }
          }
          else {
            // WARNING: the "+1" heuristic easily fails. E.g. in case of `IfStatement`, where `test` is visited after the blocks.
            if (resultCallId) {
              // the last trace we saw was a successful function call. 
              //    -> error was caused by next trace after that function call.
              const resultTrace = this.dp.collections.traces.getById(resultCallId);
              // trace.staticTraceId = resultTrace.staticTraceId + 1;
              // trace.staticTraceId = resultTrace.staticTraceId;
            }
            else {
              // trace.staticTraceId = staticTraceId + 1;

              // trace.staticTraceId = staticTraceId;
            }
          }
        }
      }
    }
    finally {
      if (errorTraces) {
        let msg = errorTraces.map(t => `${this.dp.util.makeTraceInfo(t)}`).join('\n ');
        this.logger.debug(`#### ${errorTraces.length} ERROR traces ####\n ${msg}`);
      }
    }
  }
}