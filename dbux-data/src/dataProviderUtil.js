import TraceType, { hasDynamicTypes, hasTraceValue, isTracePop, isBeforeCallExpression } from 'dbux-common/src/core/constants/TraceType';
import { pushArrayOfArray } from 'dbux-common/src/util/arrayUtil';
import EmptyArray from 'dbux-common/src/util/EmptyArray';
import { newLogger } from 'dbux-common/src/log/logger';
import { isVirtualContextType } from 'dbux-common/src/core/constants/StaticContextType';
import { isRealContextType } from 'dbux-common/src/core/constants/ExecutionContextType';
import DataProvider from './DataProvider';
import { isCallResult, hasCallId } from '../../dbux-common/src/core/constants/traceCategorization';
import { isObjectCategory } from '../../dbux-common/src/core/constants/ValueTypeCategory';

const { log, debug, warn, error: logError } = newLogger('dataProviderUtil');

export default {

  // ###########################################################################
  // Program utils
  // ###########################################################################

  getFilePathFromProgramId(dp: DataProvider, programId) {
    return dp.collections.staticProgramContexts.getById(programId)?.filePath || null;
  },

  // ###########################################################################
  // contexts
  // ###########################################################################

  getContextsByTrackId(dp: DataProvider, trackId) {
    const traces = dp.indexes.traces.byTrackId.get(trackId);
    const contextsSet = new Set();
    traces.forEach((trace) => {
      contextsSet.add(dp.collections.executionContexts.getById(trace.contextId));
    });
    return Array.from(contextsSet);
  },

  getAllRootContexts(dp: DataProvider) {
    return dp.indexes.executionContexts.roots.get(1);
  },

  getRootContextIdByContextId(dp: DataProvider, contextId) {
    const { executionContexts } = dp.collections;
    let lastContextId = contextId;
    let parentContextId;
    while ((parentContextId = executionContexts.getById(lastContextId).parentContextId)) {
      lastContextId = parentContextId;
    }
    return lastContextId;
  },

  getFirstContextsInRuns(dp: DataProvider) {
    return dp.indexes.executionContexts.firstInRuns.get(1);
  },

  getFirstTracesInRuns(dp: DataProvider) {
    return dp.indexes.traces.firsts.get(1);
  },

  getAllErrorTraces(dp: DataProvider) {
    return dp.indexes.traces.error.get(1) || EmptyArray;
  },

  // ###########################################################################
  // static contexts
  // ###########################################################################

  getStaticContextParent(dp: DataProvider, staticContextId) {
    const staticContext = dp.collections.staticContexts.getById(staticContextId);
    const { parentId } = staticContext;
    return dp.collections.staticContexts.getById(parentId);
  },


  // ###########################################################################
  // traces
  // ###########################################################################

  getTraceType(dp: DataProvider, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    const {
      staticTraceId,
      type: dynamicType
    } = trace;
    const staticTrace = dp.collections.staticTraces.getById(staticTraceId);
    const {
      type: staticType,
    } = staticTrace;
    return dynamicType || staticType;
  },

  getFirstTraceOfContext(dp: DataProvider, contextId) {
    const traces = dp.indexes.traces.byContext.get(contextId);
    if (!traces?.length) {
      return null;
    }
    return traces[0];
  },

  getLastTraceOfContext(dp: DataProvider, contextId) {
    const traces = dp.indexes.traces.byContext.get(contextId);
    if (!traces?.length) {
      return null;
    }
    return traces[traces.length - 1];
  },

  getParentTraceOfContext(dp: DataProvider, contextId) {
    const context = dp.collections.executionContexts.getById(contextId);
    const parentTrace = dp.collections.traces.getById(context.parentTraceId);

    return parentTrace;
  },

  getFirstTraceOfRun(dp: DataProvider, runId) {
    const traces = dp.indexes.traces.byRun.get(runId);
    if (!traces?.length) {
      return null;
    }
    return traces[0];
  },

  getLastTraceOfRun(dp: DataProvider, runId) {
    const traces = dp.indexes.traces.byRun.get(runId);
    if (!traces?.length) {
      return null;
    }
    return traces[traces.length - 1];
  },

  isFirstTraceOfRun(dp: DataProvider, traceId) {
    const { runId } = dp.collections.traces.getById(traceId);
    const firstTraceId = dp.util.getFirstTraceOfRun(runId).traceId;
    return firstTraceId === traceId;
  },

  isTraceRealObject(dp: DataProvider, traceId) {
    const { valueId } = dp.collections.traces.getById(traceId);
    if (valueId) {
      const { category } = dp.collections.values.getById(valueId);
      if (category) {
        return isObjectCategory(category);
      }
    }
    return false;
  },

  doesTraceHaveValue(dp: DataProvider, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    const { staticTraceId, type: dynamicType } = trace;
    if (dynamicType) {
      return hasTraceValue(dynamicType);
    }
    return dp.util.doesStaticTraceHaveValue(staticTraceId);
  },

  doesStaticTraceHaveValue(dp: DataProvider, staticTraceId) {
    const staticTrace = dp.collections.staticTraces.getById(staticTraceId);
    return hasTraceValue(staticTrace.type);
  },

  getTraceValue(dp: DataProvider, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    const { value } = trace;
    if (value !== undefined) {
      return value;
    }

    return dp.util.getTraceValueRef(traceId)?.value || undefined;
  },

  getTraceValueString(dp: DataProvider, traceId) {
    return dp.util.getTraceValueRef(traceId)?.valueString;
  },

  getTraceValueRef(dp: DataProvider, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    const { valueId } = trace;

    if (valueId) {
      // value is reference type
      const ref = dp.collections.values.getById(valueId);
      return ref;
    }

    // value is primitive type (or trace has no value)
    return null;
  },

  getTraceContext(dp: DataProvider, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    const { contextId } = trace;
    return dp.collections.executionContexts.getById(contextId);
  },

  isTraceInRealContext(dp: DataProvider, traceId) {
    const { contextId } = dp.collections.traces.getById(traceId);
    const { contextType } = dp.collections.executionContexts.getById(contextId);

    return isRealContextType(contextType);
  },

  getRealContextId(dp: DataProvider, traceId) {
    const { contextId } = dp.collections.traces.getById(traceId);
    const context = dp.collections.executionContexts.getById(contextId);
    const { parentContextId } = context;
    const parentContext = dp.collections.executionContexts.getById(parentContextId);

    if (isRealContextType(context.contextType)) {
      return contextId;
    }
    else if (parentContext && isRealContextType(parentContext.contextType)) {
      return parentContextId;
    }
    else {
      logError('Could not find realContext.');
      return null;
    }
  },

  getTracesOfRealContext(dp: DataProvider, traceId) {
    const { contextId } = dp.collections.traces.getById(traceId);
    if (dp.util.isTraceInRealContext(traceId)) {
      return dp.indexes.traces.byContext.get(contextId);
    }
    else {
      const context = dp.collections.executionContexts.getById(contextId);
      const { parentContextId } = context;
      return dp.indexes.traces.byParentContext.get(parentContextId);
    }
  },

  getTraceContextType(dp: DataProvider, traceId) {
    const staticContext = dp.util.getTraceStaticContext(traceId);
    return staticContext.type;
  },

  getStaticTraceProgramId(dp: DataProvider, staticTraceId) {
    const staticTrace = dp.collections.staticTraces.getById(staticTraceId);
    const {
      staticContextId
    } = staticTrace;

    const staticContext = dp.collections.staticContexts.getById(staticContextId);
    const { programId } = staticContext;
    return programId;
  },

  getTraceProgramId(dp: DataProvider, traceId) {
    const trace = dp.collections.traces.getById(traceId);

    const {
      staticTraceId,
    } = trace;

    return dp.util.getStaticTraceProgramId(staticTraceId);
  },

  getTraceFilePath(dp: DataProvider, traceId) {
    const programId = dp.util.getTraceProgramId(traceId);
    return programId && dp.util.getFilePathFromProgramId(programId) || null;
  },

  getTraceFileName(dp: DataProvider, traceId) {
    const programId = dp.util.getTraceProgramId(traceId);
    return programId && dp.collections.staticProgramContexts.getById(programId).fileName || null;
  },

  getTraceStaticContextId(dp: DataProvider, traceId) {
    const context = dp.util.getTraceContext(traceId);
    const { staticContextId } = context;
    return staticContextId;
  },

  getTraceStaticContext(dp: DataProvider, traceId) {
    const staticContextId = dp.util.getTraceStaticContextId(traceId);
    return dp.collections.staticContexts.getById(staticContextId);
  },

  getCalleeTraceOfArg(dp: DataProvider, traceId) {
    const argTrace = dp.collections.traces.getById(traceId);
    const { callId } = argTrace;

    return callId && dp.collections.traces.getById(callId) || null;
  },

  /**
   * Get callId of a call related trace
   */
  getCalleeTraceId(dp: DataProvider, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    const context = dp.collections.executionContexts.getById(trace.contextId);
    if (context.schedulerTraceId) {
      // trace is push/pop callback
      return dp.util.getCalleeTraceId(context.schedulerTraceId);
    }
    else if (hasCallId(trace)) {
      // trace is call/callback argument or BeforeCallExpression
      return trace.callId;
    }
    else if (isCallResult(trace)) {
      // trace is call expression result
      return trace.resultCallId;
    }
    else {
      // not a call related trace
      return null;
    }
  },

  /**
   * Get callId of a executionContext
   */
  getCalleeTraceOfContext(dp: DataProvider, contextId) {
    const parentTrace = dp.util.getParentTraceOfContext(contextId);
    if (parentTrace) {
      const calleeId = dp.util.getCalleeTraceId(parentTrace.traceId);
      return dp.collections.traces.getById(calleeId);
    }
    return null;
  },

  isTraceArgument(dp: DataProvider, traceId) {
    // a trace is an argument if it has callId not pointing to itself
    const trace = dp.collections.traces.getById(traceId);
    if (trace.callId) {
      if (trace.callId !== trace.traceId) {
        return true
      }
    }
    return false;
  },

  getCalleeStaticTrace(dp: DataProvider, traceId) {
    const argTrace = dp.collections.traces.getById(traceId);
    const { staticTraceId } = argTrace;
    const staticTrace = dp.collections.staticTraces.getById(staticTraceId);
    const { callId: callStaticId } = staticTrace;

    return callStaticId && dp.collections.staticTraces.getById(callStaticId) || null;
  },

  /**
   * Return the result trace in the call if exist
   */
  getCallResultTrace(dp: DataProvider, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    const traceType = dp.util.getTraceType(traceId);
    if (trace.schedulerTraceId) {
      // trace is push/pop callback
      return dp.util.getCallResultTrace(trace.schedulerTraceId);
    }
    else if (isBeforeCallExpression(traceType)) {
      if (trace.resultId) {
        // trace is a BeforeCallExpression and has result
        return dp.collections.traces.getById(trace.resultId);
      }
      return null;
    }
    // else if (isCallArgumentTrace(trace)) {
    else if (hasCallId(trace)) {
      // call argument
      return dp.util.getCallResultTrace(trace.callId);
    }
    else if (isCallResult(trace)) {
      // trace itself is a resultTrace
      return trace;
    }

    // Not a call related trace or the call does not have a result
    return null;
  },

  // ###########################################################################
  // traces of interruptable functions
  // ###########################################################################
  /**
   * @param {DataProvider} dp 
   */
  getAllTracesOfStaticContext(dp, staticContextId) {
    const staticContext = dp.collections.staticContexts.getById(staticContextId);
    if (!staticContext) {
      return null;
    }

    const {
      type: staticContextType
    } = staticContext;

    let traces;
    if (isVirtualContextType(staticContextType)) {
      // Get all traces of the actual function, not it's virtual children (such as `Await`, `Resume` et al)
      // NOTE: `Await` and `Yield` contexts do not contain traces, only `Resume` contexts contain traces for interruptable functions
      traces = dp.util.getTracesOfParentStaticContext(staticContextId);
    }
    else {
      // find all traces belonging to that staticContext
      traces = dp.indexes.traces.byStaticContext.get(staticContextId) || EmptyArray;
    }
    return traces;
  },

  /**
   * @param {DataProvider} dp 
   */
  getTracesOfParentStaticContext(dp, staticContextId) {
    const staticContext = dp.collections.staticContexts.getById(staticContextId);
    const parentStaticContextId = staticContext.parentId;
    // const parentStaticContext = dp.collections.staticContexts.getById(parentStaticContextId);
    return dp.indexes.traces.byParentStaticContext.get(parentStaticContextId) || EmptyArray;
  },


  // ###########################################################################
  // trace grouping
  // ###########################################################################

  /**
   * Groups traces by TraceType, as well as staticTraceId.
   * 
   * TODO: improve performance, use MultiKeyIndex instead
   */
  groupTracesByType(dp: DataProvider, staticTraces: StaticTrace[]) {
    const groups = [];
    for (const staticTrace of staticTraces) {
      const {
        type: staticType,
        staticTraceId
      } = staticTrace;

      const traces = dp.indexes.traces.byStaticTrace.get(staticTraceId);
      if (!traces) {
        continue;
      }

      if (!hasDynamicTypes(staticType)) {
        // one group of traces
        pushArrayOfArray(groups, staticType, [staticTrace, traces]);
      }
      else {
        // multiple groups of traces for this `staticTrace`
        const traceGroups = [];
        for (const trace of traces) {
          const { type: dynamicType } = trace;
          pushArrayOfArray(traceGroups, dynamicType || staticType, trace);
        }

        for (let type = 0; type < traceGroups.length; ++type) {
          const tracesOfGroup = traceGroups[type];
          if (tracesOfGroup) {
            pushArrayOfArray(groups, type, [staticTrace, tracesOfGroup]);
          }
        }
      }
    }
    return groups;
  },

  // ###########################################################################
  // Call expressions
  // ###########################################################################

  /**
   * 
   */
  getStaticCallId(dp, staticTraceId) {
    const staticTrace = dp.collections.staticTraces.getById(staticTraceId);
    return staticTrace.resultCallId || staticTrace.callId;
  },

  // ###########################################################################
  // Contexts + their traces
  // ###########################################################################

  /**
   * Whether this is the last trace we have seen in its context.
   * NOTE: Ignores final `PopImmediate`.
   */
  isLastTraceInRealContext(dp, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    const { contextId } = trace;
    return dp.util.getLastTraceInRealContext(contextId) === trace;
  },

  /**
   * Whether this is the last trace of its static context
   * NOTE: Ignores final `PopImmediate`.
   */
  isLastStaticTraceInContext(dp, staticTraceId) {
    const staticTrace = dp.collections.staticTraces.getById(staticTraceId);
    const { staticContextId } = staticTrace;
    return dp.util.getLastStaticTraceInContext(staticContextId) === staticTrace;
  },

  getActualLastTraceInRealContext(dp, contextId) {
    const traces = dp.indexes.traces.byRealContext.get(contextId);
    return traces?.[traces.length - 1] || null;
  },

  /**
   * Whether this is the last trace we have seen in its context.
   * NOTE: Ignores final `PopImmediate`.
   */
  getLastTraceInRealContext(dp, contextId) {
    const traces = dp.indexes.traces.byRealContext.get(contextId);
    let last = traces?.[traces.length - 1] || null;
    if (last) {
      // ignore pop
      const { traceId: lastId } = last;
      const traceType = dp.util.getTraceType(lastId);
      if (isTracePop(traceType)) {
        last = traces[traces.length - 2] || null;
      }
    }
    return last;
  },

  /**
   * Whether this is the last trace of its static context.
   * NOTE: Ignores final `PopImmediate`.
   */
  getLastStaticTraceInContext(dp, staticContextId) {
    const staticTraces = dp.indexes.staticTraces.byContext.get(staticContextId);
    let last = staticTraces?.[staticTraces.length - 1] || null;
    if (isTracePop(last?.type)) {
      // ignore pop
      last = staticTraces[staticTraces.length - 2] || null;
    }
    return last;
  },

  hasRealContextPopped(dp, contextId) {
    const lastTrace = dp.util.getActualLastTraceInRealContext(contextId);
    return lastTrace && isTracePop(dp.util.getTraceType(lastTrace.traceId)) || false;
  },

  // ###########################################################################
  // Error handling
  // ###########################################################################

  // isErrorTrace(dp, traceId) {
  //   // ` && `getLastTraceInRealContext.staticTrace` !== ``getLastStaticTraceInRealContext

  //   const trace = dp.collections.traces.getById(traceId);
  //   const { staticTraceId } = trace;
  //   const traceType = dp.util.getTraceType(traceId);

  //   console.log('errorTrace', !isReturnTrace(traceType),

  //     traceId, staticTraceId,
  //     dp.util.getRealContextId(traceId),

  //     dp.util.getLastTraceInRealContext(dp.util.getRealContextId(traceId))?.traceId,
  //     dp.util.getLastStaticTraceInContext(dp.collections.staticTraces.getById(staticTraceId).staticContextId)?.staticTraceId,

  //     // is last trace we have recorded in context
  //     dp.util.isLastTraceInRealContext(traceId),

  //     // but is not last trace in the code
  //     !dp.util.isLastStaticTraceInContext(staticTraceId),

  //     // the context must have popped (finished), or else there was no error (yet)
  //     dp.util.hasRealContextPopped(dp.util.getRealContextId(traceId)));

  //   // is not a return trace (because return traces indicate function succeeded)
  //   return !isReturnTrace(traceType) &&

  //     // is last trace we have recorded in context
  //     dp.util.isLastTraceInRealContext(traceId) &&

  //     // but is not last trace in the code
  //     !dp.util.isLastStaticTraceInContext(staticTraceId) &&

  //     // the context must have popped (finished), or else there was no error (yet)
  //     dp.util.hasRealContextPopped(dp.util.getRealContextId(traceId));
  // },

  // hasContextError(dp, realContextId) {
  //   const trace = dp.util.getLastTraceInRealContext(realContextId);
  //   return dp.util.isErrorTrace(trace);
  // },
};