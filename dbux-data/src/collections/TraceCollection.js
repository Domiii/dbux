import SpecialDynamicTraceType from '@dbux/common/src/types/constants/SpecialDynamicTraceType';
import SpecialObjectType from '@dbux/common/src/types/constants/SpecialObjectType';
import { isDataLinkPurpose, isWarnPurpose } from '@dbux/common/src/types/constants/TracePurpose';
import TraceType, { isTraceFunctionExit, isTracePop, isTraceReturn, isTraceReturnOrBranchPop, isTraceThrow } from '@dbux/common/src/types/constants/TraceType';
import Trace from '@dbux/common/src/types/Trace';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import Collection from '../Collection';

/** @typedef { import("./ExecutionContextCollection").default } ExecutionContextCollection */

/**
 * @extends {Collection<Trace>}
 */
export default class TraceCollection extends Collection {
  lastContextId = -1;
  lastCodeChunkId = 0;
  warnTraces = [];

  constructor(dp) {
    super('traces', dp);
    this.addedErrorTraces = new Set();
  }

  addEntry(trace) {
    super.addEntry(trace);
    if (trace) {
      // set applicationId
      trace.applicationId = this.dp.application.applicationId;
    }
  }

  serialize(trace) {
    const traceData = { ...trace };

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
  }

  /**
   * NOTE: We do DataNodes here. They are needed in {@link DataNodeCollection#postIndexProcessed}
   */
  postIndexRaw(traces) {
    // this.errorWrapMethod('resolveMonkeyParams', traces);
    this.errorWrapMethod('resolveDataNodes', traces);
  }

  postIndexProcessed(traces) {
    this.errorWrapMethod('resolveErrorTraces', traces);
    this.errorWrapMethod('recordErrorTraces', traces);
  }

  registerResultId(traces) {
    for (const { traceId, resultCallId } of traces) {
      if (resultCallId) {
        const bceTrace = this.dp.collections.traces.getById(resultCallId);
        if (bceTrace) {
          bceTrace.resultId = traceId;
        }
        else {
          // TODO: should not happen...
          this.logger.warn(`Could not find BCE for CRT ${this.dp.util.makeTraceInfo(traceId)}`);
        }
      }
    }
  }

  registerValueRefSpecialObjectType(traces) {
    for (const trace of traces) {
      const { traceId, staticTraceId, nodeId } = trace;
      const staticTrace = this.dp.collections.staticTraces.getById(staticTraceId);
      if (!staticTrace) {
        this.logger.warn(`Could not find staticTrace #${staticTraceId} for trace #${traceId} in "registerValueRefSpecialObjectType"`);
        continue;
      }
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
   * @param {Trace[]} traces 
   */
  resolveDataNodes(traces) {
    for (const trace of traces) {
      if (SpecialDynamicTraceType.is.ArrayHofCall(trace.data?.specialDynamicType)) {
        // 1. Array HOFs
        // TODO: remove specialDynamicType and use purpose instead
        this.dp.collections.executionContexts.resolveBuiltInHOFParamDataNodes(trace);
      }
      if (trace.purposes) {
        // 2. Purpose-based DataNode linkage
        for (const purpose of trace.purposes) {
          if (isWarnPurpose(purpose.type)) {
            this.warnTraces.push(trace.traceId);
          }
          this.dp.collections.dataNodes.resolveDataNodeLinks(trace, purpose);
        }
      }
      const { dp } = this;
      // const staticTrace = dp.util.getStaticTrace(trace.traceId);
      // if (staticTrace.purposes) {
      //   // 2b. Purpose-based DataNode linkage
      //   for (const purpose of staticTrace.purposes) {
      //     this.dp.collections.dataNodes.resolveDataNodeLinks(trace, purpose);
      //   }
      // }

      const traceType = dp.util.getTraceType(trace.traceId);
      if (TraceType.is.BeforeCallExpression(traceType)) {
        const callId = trace.traceId;
        const bceDataNode = dp.util.getOwnDataNodeOfTrace(callId);
        if (bceDataNode) {
          // TODO: use purpose instead
          // 3. BCE has "own" DataNode (caused by monkey patching, specifically by `createBCEOwnDataNode`)
          if (trace.resultId) {
            const resultDataNode = dp.util.getOwnDataNodeOfTrace(trace.resultId);
            if (resultDataNode && !resultDataNode.inputs?.length) {
              resultDataNode.inputs = [bceDataNode.nodeId];
            }
          }
        }
      }
    }
  }

  /**
   * Link arg <-> param DataNodes of monkey-patched builtin functions.
   * For normal functions, consider {@link ExecutionContextCollection#setParamInputs}
   */
  resolveMonkeyParams(traces) {
    /**
     * NOTE: Disabled for now. This does not seem necessary anymore.
     * @see https://github.com/Domiii/dbux/issues/669
     */

    // for (const trace of traces) {
    //   const { traceId: callId, data } = trace;
    //   const monkey = data?.monkey;
    //   if (monkey?.wireInputs) {
    //     // NOTE: function is monkey-patched, and generated it's own set of ("monkey") `DataNode`s, one per argument

    //     // monkeyDataNodes are attached to `BCE` (because result trace is not available while monkey'ing)
    //     const monkeyDataNodes = this.dp.indexes.dataNodes.byTrace.get(callId);

    //     // get `argDataNodes` (flattened, in case of spread)
    //     const argDataNodes = this.dp.util.getCallArgDataNodes(callId);

    //     if (!monkeyDataNodes || !argDataNodes) {
    //       continue;
    //     }

    //     // wire monkey <-> arg DataNodes (should be 1:1)
    //     for (let i = 0; i < monkeyDataNodes.length; i++) {
    //       const monkeyDataNode = monkeyDataNodes[i];
    //       const argDataNode = argDataNodes[i];

    //       // set argument nodes as input nodes for monkey result nodes
    //       // NOTE: argDataNode might be missing (e.g. because it had a "dbux disable" instruction)
    //       argDataNode && (monkeyDataNode.inputs = [argDataNode.nodeId]);
    //     }
    //   }
    // }
  }

  /**
   * This is used to add error trace to indexes. Since trace.error is resolved in `postIndex`, we have to add these manually.
   * @param {Trace[]} traces
   */
  recordErrorTraces(traces) {
    // records all error traces per dp to prevent duplication
    this.addedErrorTraces = new Set();
    // records new actual error traces for logging purpose 
    const newErrorTraces = [];

    // check and add potential errors
    if (this._newPotentialErrorTraces) {
      for (const trace of this._newPotentialErrorTraces) {
        if (trace.error && !this.addedErrorTraces.has(trace)) {
          this.dp.indexes.traces.error.addEntry(trace);
          this.dp.indexes.traces.errorByContext.addEntry(trace);
          this.dp.indexes.traces.errorByRoot.addEntry(trace);
          this.addedErrorTraces.add(trace);
          newErrorTraces.push(trace);
        }
      }
    }
    this._newPotentialErrorTraces = EmptyArray;

    if (newErrorTraces.length) {
      /**
       * hackfix: array might be unordered after insertion, needs to sort them manually
       */
      this.dp.indexes.traces.error.get(1).sort((t1, t2) => t1.traceId - t2.traceId);
    }

    // if (newErrorTraces.length) {
    //   const msg = newErrorTraces.map(t => `${this.dp.util.makeTraceInfo(t)}`).join('\n ');
    //   this.logger.debug(`#### ${newErrorTraces.length} ERROR traces ####\n ${msg}`);
    // }
  }

  /**
   * @param {Trace[]} traces 
   */
  resolveErrorTraces(traces) {
    /**
     * hackfix: record new error traces in temp array, to correctly record previous trace in previous run
     */
    this._newPotentialErrorTraces = [];
    const { dp: { util } } = this;
    for (const trace of traces) {
      try {
        const {
          traceId,
          contextId,
        } = trace;

        const traceType = util.getTraceType(traceId);
        if (TraceType.is.ThrowArgument(traceType)) {
          trace.error = true;
          this._newPotentialErrorTraces.push(trace);
        }

        // if traces were disabled, there is nothing to do here
        if (!util.isContextTraced(contextId)) {
          continue;
        }

        const staticContext = util.getTraceStaticContext(traceId);
        if (staticContext.isInterruptable) {
          // NOTE: interruptable contexts only have `Push` and `Pop` traces.
          //    Everything else (including error handling!) is in `Resume` children.
          continue;
        }

        if (!(TraceType.is.Catch(traceType) || TraceType.is.Finally(traceType) || isTracePop(traceType))) {
          /**
           * performance hackfix
           * @see https://github.com/Domiii/dbux/issues/637
           */
          continue;
        }

        const previousTrace = this.dp.callGraph._getPreviousInContext(traceId);
        if (!previousTrace) {
          // this should not happen, only happen if trace is push
          this.logger.warn(`Cannot find previousTrace for potential error trace ${JSON.stringify(trace)}`);
          continue;
        }
        const previousTraceId = previousTrace.traceId;
        const previousTraceType = util.getTraceType(previousTraceId);

        if (TraceType.is.Catch(traceType)) {
          previousTrace.error = true;
          this._newPotentialErrorTraces.push(previousTrace);
        }
        else if (TraceType.is.Finally(traceType)) {
          if (!TraceType.is.TryExit(previousTraceType) && !isTraceReturnOrBranchPop(previousTraceType)) {
            previousTrace.error = true;
            this._newPotentialErrorTraces.push(previousTrace);
          }
        }
        else if (isTracePop(traceType)) {
          if (!isTraceReturnOrBranchPop(previousTraceType) && !isTraceFunctionExit(previousTraceType) && !TraceType.is.FinallyExit(previousTraceType)) {
            previousTrace.error = true;
            this._newPotentialErrorTraces.push(previousTrace);
          }
        }

        // if (!isTraceFunctionExit(previousTraceType)) {
        //   // before pop must be `EndOfContext` or `Return*` trace, else -> we detect an error!
        //   // NOTE: we check for any `Return*` type of trace anywhere, since, in case of `finally`, 
        //   // the last trace might not be `return` trace
        //   // util.getReturnTraceOfRealContext(contextId);

        //   trace.error = true;
        //   // // use lastTrace instead of pop trace itself for more accurate location
        //   // const lastTraceInContext = this.dp.callGraph._getPreviousInContext(traceId);
        //   // lastTraceInContext.error = true;

        //   // guess error trace
        //   const { staticTraceId, callId, resultCallId } = previousTrace;
        //   if (isTraceThrow(previousTraceType)) {
        //     // trace is `throw`
        //     trace.staticTraceId = staticTraceId;
        //   }
        //   else if (callId) {
        //     // participates in a call but call did not finish -> set expected error trace to BCE
        //     const callTrace = this.dp.collections.traces.getById(callId);
        //     if (callTrace.resultId) {
        //       // strange...
        //       this.logger.error('last (non-result) call trace in error context has `resultId`', callTrace.resultId, callTrace);
        //     }
        //     else {
        //       // the call trace caused the error
        //       // trace.staticTraceId = callTrace.staticTraceId;
        //     }
        //   }
        //   else {
        //     // WARNING: the "+1" heuristic easily fails. E.g. in case of `IfStatement`, where `test` is visited after the blocks.
        //     if (resultCallId) {
        //       // the last trace we saw was a successful function call. 
        //       //    -> error was caused by next trace after that function call.
        //       const resultTrace = this.dp.collections.traces.getById(resultCallId);
        //       // trace.staticTraceId = resultTrace.staticTraceId + 1;
        //       // trace.staticTraceId = resultTrace.staticTraceId;
        //     }
        //     else {
        //       // trace.staticTraceId = staticTraceId + 1;

        //       // trace.staticTraceId = staticTraceId;
        //     }
        //   }
        // }
      }
      catch (err) {
        this.logger.warn(`resolveErrorTrace failed for: "${util.makeTraceInfo(trace)}"\n  `, err);
      }
    }
  }
}