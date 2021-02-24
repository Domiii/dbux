import TraceType, { hasDynamicTypes, hasTraceValue, isTracePop, isBeforeCallExpression } from '@dbux/common/src/core/constants/TraceType';
import { pushArrayOfArray } from '@dbux/common/src/util/arrayUtil';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { newLogger } from '@dbux/common/src/log/logger';
import StaticTrace from '@dbux/common/src/core/data/StaticTrace';
import { isVirtualContextType } from '@dbux/common/src/core/constants/StaticContextType';
import { isRealContextType } from '@dbux/common/src/core/constants/ExecutionContextType';
import { isCallResult, hasCallId } from '@dbux/common/src/core/constants/traceCategorization';
import ValueTypeCategory, { isObjectCategory, isPlainObjectOrArrayCategory, isFunctionCategory, ValuePruneState } from '@dbux/common/src/core/constants/ValueTypeCategory';

/**
 * @typedef {import('./RuntimeDataProvider').RuntimeDataProvider} DataProvider
 */

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('dataProviderUtil');

export default {

  // ###########################################################################
  // Program utils
  // ###########################################################################
  /** @param {DataProvider} dp */
  getFilePathFromProgramId(dp, programId) {
    return dp.collections.staticProgramContexts.getById(programId)?.filePath || null;
  },

  // ###########################################################################
  // contexts
  // ###########################################################################
  /** @param {DataProvider} dp */
  getContextsByTrackId(dp, trackId) {
    const traces = dp.indexes.traces.byTrackId.get(trackId);
    const contextsSet = new Set();
    traces.forEach((trace) => {
      contextsSet.add(dp.collections.executionContexts.getById(trace.contextId));
    });
    return Array.from(contextsSet);
  },

  /** @param {DataProvider} dp */
  getAllRootContexts(dp) {
    return dp.indexes.executionContexts.roots.get(1);
  },

  /** @param {DataProvider} dp */
  getRootContextIdByContextId(dp, contextId) {
    const { executionContexts } = dp.collections;
    let lastContextId = contextId;
    let parentContextId;
    while ((parentContextId = executionContexts.getById(lastContextId).parentContextId)) {
      lastContextId = parentContextId;
    }
    return lastContextId;
  },

  /** @param {DataProvider} dp */
  getFirstContextsInRuns(dp) {
    return dp.indexes.executionContexts.firstInRuns.get(1);
  },

  /** @param {DataProvider} dp */
  getFirstTracesInRuns(dp) {
    return dp.indexes.traces.firsts.get(1);
  },

  /** @param {DataProvider} dp */
  getAllErrorTraces(dp) {
    return dp.indexes.traces.error.get(1) || EmptyArray;
  },

  /** @param {DataProvider} dp */
  searchContexts(dp, searchTerm) {
    searchTerm = searchTerm.toLowerCase();

    return dp.util.getAllExecutedStaticContexts().
      filter(staticContext => {
        return staticContext.displayName.toLowerCase().includes(searchTerm);
      }).
      map(staticContext =>
        dp.indexes.executionContexts.byStaticContext.get(staticContext.staticContextId)
      ).
      flat();
  },

  findContextsByTraceSearchTerm(dp, searchTerm) {
    searchTerm = searchTerm.toLowerCase();

    return dp.util.getAllExecutedStaticContexts().
      filter(staticContext => {
        const staticTraces = dp.util.getExecutedStaticTracesInStaticContext(staticContext.staticContextId);
        return staticTraces.some(staticTrace =>
          staticTrace.displayName?.toLowerCase().includes(searchTerm)
        );
      }).
      map(staticContext =>
        dp.indexes.executionContexts.byStaticContext.get(staticContext.staticContextId)
      ).
      flat();
  },

  // ###########################################################################
  // static contexts + static traces
  // ###########################################################################

  /** @param {DataProvider} dp */
  getStaticContextParent(dp, staticContextId) {
    const staticContext = dp.collections.staticContexts.getById(staticContextId);
    const { parentId } = staticContext;
    return dp.collections.staticContexts.getById(parentId);
  },

  getAllExecutedStaticContextIds(dp) {
    // NOTE: needs improved performance, if used a lot
    const staticContextIds = new Set(
      dp.collections.executionContexts.getAll().map(context => {
        if (!context) {
          return 0;
        }

        const { staticContextId } = context;
        return staticContextId;
      })
    );
    staticContextIds.delete(0);
    return Array.from(staticContextIds);
  },

  getAllExecutedStaticContexts(dp) {
    const staticContextIds = dp.util.getAllExecutedStaticContextIds();
    return staticContextIds.map(staticContextId =>
      dp.collections.staticContexts.getById(staticContextId));
  },

  // getAllExecutedStaticTraces(dp) {
  //  // TODO: NIY
  // },

  getExecutedStaticTracesInStaticContext(dp, staticContextId) {
    return dp.indexes.staticTraces.byContext.get(staticContextId);
  },

  // ###########################################################################
  // run
  // ###########################################################################

  /** @param {DataProvider} dp */
  getRunCreatedAt(dp, runId) {
    return dp.indexes.executionContexts.byRun.get(runId)[0]?.createdAt || null;
  },

  // ###########################################################################
  // traces
  // ###########################################################################

  /** @param {DataProvider} dp */
  getTraceType(dp, traceId) {
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

  /** @param {DataProvider} dp */
  getFirstTraceOfContext(dp, contextId) {
    const traces = dp.indexes.traces.byContext.get(contextId);
    if (!traces?.length) {
      return null;
    }
    return traces[0];
  },

  /** @param {DataProvider} dp */
  getLastTraceOfContext(dp, contextId) {
    const traces = dp.indexes.traces.byContext.get(contextId);
    if (!traces?.length) {
      return null;
    }
    return traces[traces.length - 1];
  },

  /**
   * Returns the parentTrace of a context, not necessarily a BCE
   * Use getCallerTraceOfContext if you want the BCE of a context
   * @param {DataProvider} dp 
   * @param {number} contextId 
   */
  getParentTraceOfContext(dp, contextId) {
    const context = dp.collections.executionContexts.getById(contextId);
    const parentTrace = dp.collections.traces.getById(context.parentTraceId);

    return parentTrace || null;
  },

  /** @param {DataProvider} dp */
  getFirstTraceOfRun(dp, runId) {
    const traces = dp.indexes.traces.byRun.get(runId);
    if (!traces?.length) {
      return null;
    }
    return traces[0];
  },

  /** @param {DataProvider} dp */
  getLastTraceOfRun(dp, runId) {
    const traces = dp.indexes.traces.byRun.get(runId);
    if (!traces?.length) {
      return null;
    }
    return traces[traces.length - 1];
  },

  /** @param {DataProvider} dp */
  isFirstTraceOfRun(dp, traceId) {
    const { runId } = dp.collections.traces.getById(traceId);
    const firstTraceId = dp.util.getFirstTraceOfRun(runId).traceId;
    return firstTraceId === traceId;
  },

  // ###########################################################################
  // trace values
  // ###########################################################################

  /**
   * NOTE: We want to link multiple traces against the same trace sometimes.
   *  e.g. we want to treat the value of a `BCE` the same as its `CRE`.
   * @param {DataProvider} dp 
  */
  getValueTrace(dp, traceId) {
    let trace = dp.collections.traces.getById(traceId);
    const traceType = dp.util.getTraceType(traceId);
    if (isBeforeCallExpression(traceType) && trace.resultId) {
      // trace is a BeforeCallExpression and has result
      return dp.collections.traces.getById(trace.resultId);
    }
    return trace;
  },

  /** @param {DataProvider} dp */
  isTraceTrackableValue(dp, traceId) {
    const valueRef = dp.util.getTraceValueRef(traceId);
    return valueRef && isObjectCategory(valueRef.category) || false;
  },

  /** @param {DataProvider} dp */
  isTracePlainObjectOrArrayValue(dp, traceId) {
    const valueRef = dp.util.getTraceValueRef(traceId);
    return valueRef && isPlainObjectOrArrayCategory(valueRef.category) || false;
  },

  /** @param {DataProvider} dp */
  isTracePlainObject(dp, traceId) {
    const valueRef = dp.util.getTraceValueRef(traceId);
    return valueRef && isPlainObjectOrArrayCategory(valueRef.category) || false;
  },

  /** @param {DataProvider} dp */
  isTraceFunctionValue(dp, traceId) {
    const valueRef = dp.util.getTraceValueRef(traceId);
    return valueRef && isFunctionCategory(valueRef.category) || false;
  },

  /** @param {DataProvider} dp */
  doesTraceHaveValue(dp, traceId) {
    const trace = dp.util.getValueTrace(traceId);
    const { value } = trace;
    if (value === undefined) {
      const valueRef = dp.util.getTraceValueRef(traceId);
      if (!valueRef) { // || valueRef.value === undefined) {
        // TODO: better distinguish between existing and non-existing values
        return false;
      }
    }
    return true;

    // const value = dp.util.getTraceValue(traceId);
    // return value !== undefined;
    // const trace = dp.collections.traces.getById(traceId);
    // const { staticTraceId, type: dynamicType } = trace;
    // if (dynamicType) {
    //   return hasTraceValue(dynamicType);
    // }
    // return dp.util.doesStaticTraceHaveValue(staticTraceId);
  },

  // doesStaticTraceHaveValue(dp, staticTraceId) {
  //   const staticTrace = dp.collections.staticTraces.getById(staticTraceId);
  //   return hasTraceValue(staticTrace.type);
  // },

  /**
   * @param {DataProvider} dp
   */
  getTraceValue(dp, traceId) {
    const trace = dp.util.getValueTrace(traceId);
    if ('value' in trace) {
      return trace.value;
    }

    const valueRef = dp.util.getTraceValueRef(traceId);
    return valueRef?.value;
  },

  /**
   * Handle special circumstances.
   */
  getTraceValueMessage(dp, traceId) {
    const valueRef = dp.util.getTraceValueRef(traceId);
    if (valueRef?.pruneState === ValuePruneState.Omitted) {
      return `(omitted value)`;
    }
    return null;
  },

  /** @param {DataProvider} dp */
  getTraceValueString(dp, traceId) {
    const trace = dp.util.getValueTrace(traceId);

    if (trace._valueString) {
      // already cached
      return trace._valueString;
    }

    const valueMessage = dp.util.getTraceValueMessage(trace.traceId);
    if (valueMessage) {
      return valueMessage;
    }

    // get value
    const value = dp.util.getTraceValue(traceId);

    let valueString;
    if (dp.util.isTraceFunctionValue(traceId)) {
      valueString = value;
    }
    else if (value === undefined) {
      valueString = 'undefined';
    }
    else {
      valueString = JSON.stringify(value);
    }

    // hackfix: we cache this thing
    return trace._valueString = valueString;
  },

  /** @param {DataProvider} dp */
  getTraceValueStringShort(dp, traceId) {
    const trace = dp.util.getValueTrace(traceId);

    if (trace._valueStringShort) {
      // already cached
      return trace._valueStringShort;
    }

    // get value
    let valueString = dp.util.getTraceValueString(traceId);
    const ShortLength = 30;
    if (valueString && valueString.length > (ShortLength - 3)) {
      if (dp.util.isTracePlainObject(traceId)) {
        // object -> just use category
        const valueRef = dp.util.getTraceValueRef(traceId);
        valueString = ValueTypeCategory.nameFrom(valueRef.category);
      }
      else {
        // TODO: do this recursively, so array-of-object does not display object itself
        valueString = valueString.substring(0, ShortLength - 3) + '...';
      }
    }

    // hackfix: we cache this thing
    return trace._valueStringShort = valueString;
  },

  /** @param {DataProvider} dp */
  getTraceValueRef(dp, traceId) {
    const trace = dp.util.getValueTrace(traceId);
    const { valueId } = trace;

    if (valueId) {
      // value is reference type
      const ref = dp.collections.values.getById(valueId);
      return ref;
    }

    // value is primitive type (or trace has no value)
    return null;
  },

  getTraceTrackId(dp, traceId) {
    const valueRef = dp.util.getTraceValueRef(traceId);
    return valueRef?.trackId;
  },

  /** @param {DataProvider} dp */
  getAllTracesOfObjectOfTrace(dp, traceId) {
    const valueRef = dp.util.getTraceValueRef(traceId);
    if (valueRef?.trackId) {
      return dp.indexes.traces.byTrackId.get(valueRef.trackId);
    }
    return null;
  },

  // ###########################################################################
  // call related trace
  // ###########################################################################


  /** @param {DataProvider} dp */
  isTraceArgument(dp, traceId) {
    // a trace is an argument if it has callId not pointing to itself
    const trace = dp.collections.traces.getById(traceId);
    if (trace.callId) {
      if (trace.callId !== trace.traceId) {
        return true;
      }
    }
    return false;
  },

  isCallBCEOrResultTrace(dp, traceId) {
    return dp.util.isCallResultTrace(traceId) || dp.util.isBCETrace(traceId);
  },

  isBCETrace(dp, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    return trace.callId && trace.callId === traceId;
  },

  isCallResultTrace(dp, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    return trace.resultCallId;
  },

  /**
   * Get callerTrace (BCE) of a call related trace, returns itself if it is not a call related trace.
   * Note: if a trace is both `CallArgument` and `CallExpressionResult`, returns the argument trace.
   * Note: we use this to find the parent trace of a given context.
   * @param {DataProvider} dp
   * @param {number} traceId
  */
  getPreviousCallerTraceOfTrace(dp, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    // TODO: deal with callback traces after context.schedulerTraceId is back
    // const context = dp.collections.executionContexts.getById(trace.contextId);
    // if (context.schedulerTraceId) {
    //   // trace is push/pop callback
    //   return dp.util.getCallerTraceOfTrace(context.schedulerTraceId);
    // }
    if (hasCallId(trace)) {
      // trace is call/callback argument or BCE
      return dp.collections.traces.getById(trace.callId);
    }
    else {
      // not a call related trace
      return trace;
      // return null;
    }
  },

  /**
   * Get callerTrace (BCE) of a call related trace, returns itself if it is not a call related trace.
   * Note: if a trace is both `CallArgument` and `CallExpressionResult`, returns the result trace.
   * @param {DataProvider} dp
   * @param {number} traceId
  */
  getCallerTraceOfTrace(dp, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    // TODO: deal with callback traces after context.schedulerTraceId is back
    // const context = dp.collections.executionContexts.getById(trace.contextId);
    // if (context.schedulerTraceId) {
    //   // trace is push/pop callback
    //   return dp.util.getCallerTraceOfTrace(context.schedulerTraceId);
    // }
    if (isCallResult(trace)) {
      // trace is call expression result
      return dp.collections.traces.getById(trace.resultCallId);
    }
    else if (hasCallId(trace)) {
      // trace is call/callback argument or BCE
      return dp.collections.traces.getById(trace.callId);
    }
    else {
      // not a call related trace
      return trace;
      // return null;
    }
  },

  /**
   * Returns the BCE of a context
   * @param {DataProvider} dp 
   * @param {number} contextId
  */
  getCallerTraceOfContext(dp, contextId) {
    const parentTrace = dp.util.getParentTraceOfContext(contextId);
    if (parentTrace) {
      // try to get BCE of call
      // NOTE: `parentTrace` of a context might not participate in a call, e.g. in case of getters or setters
      const callerTrace = dp.util.getPreviousCallerTraceOfTrace(parentTrace.traceId);
      return callerTrace;
    }
    return null;
  },

  /** @param {DataProvider} dp */
  getCalleeStaticTrace(dp, traceId) {
    const argTrace = dp.collections.traces.getById(traceId);
    const { staticTraceId } = argTrace;
    const staticTrace = dp.collections.staticTraces.getById(staticTraceId);
    const { callId: callStaticId } = staticTrace;

    return callStaticId && dp.collections.staticTraces.getById(callStaticId) || null;
  },

  /**
   * Return the result trace in the call if exist
   * @param {DataProvider} dp 
  */
  getCallResultTrace(dp, traceId) {
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

  /**
   * @param {DataProvider} dp 
  */
  getStaticCallId(dp, staticTraceId) {
    const staticTrace = dp.collections.staticTraces.getById(staticTraceId);
    return staticTrace.resultCallId || staticTrace.callId;
  },

  // ###########################################################################
  // contexts
  // ###########################################################################

  /** @param {DataProvider} dp */
  getTraceContext(dp, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    const { contextId } = trace;
    return dp.collections.executionContexts.getById(contextId);
  },

  /** @param {DataProvider} dp */
  isTraceInRealContext(dp, traceId) {
    const { contextId } = dp.collections.traces.getById(traceId);
    const { contextType } = dp.collections.executionContexts.getById(contextId);

    return isRealContextType(contextType);
  },

  /** @param {DataProvider} dp */
  getRealContextId(dp, traceId) {
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

  /** @param {DataProvider} dp */
  getTracesOfRealContext(dp, traceId) {
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

  /** @param {DataProvider} dp */
  getTraceStaticContextId(dp, traceId) {
    const context = dp.util.getTraceContext(traceId);
    const { staticContextId } = context;
    return staticContextId;
  },

  /** @param {DataProvider} dp */
  getTraceStaticContext(dp, traceId) {
    const staticContextId = dp.util.getTraceStaticContextId(traceId);
    return dp.collections.staticContexts.getById(staticContextId);
  },

  /** @param {DataProvider} dp */
  getFirstContextOfRun(dp, runId) {
    const contexts = dp.indexes.executionContexts.byRun.get(runId);
    if (!contexts?.length) {
      return null;
    }
    return contexts[0];
  },

  /** @param {DataProvider} dp */
  isFirstContextOfRun(dp, contextId) {
    const { runId } = dp.collections.executionContexts.getById(contextId);
    const firstContextId = dp.util.getFirstContextOfRun(runId)?.contextId;
    return firstContextId === contextId;
  },

  // ###########################################################################
  // misc
  // ###########################################################################

  /** @param {DataProvider} dp */
  getTraceContextType(dp, traceId) {
    const staticContext = dp.util.getTraceStaticContext(traceId);
    return staticContext.type;
  },

  getTrace(dp, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    return trace;
  },

  getStaticTrace(dp, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    const { staticTraceId } = trace;
    return dp.collections.staticTraces.getById(staticTraceId);
  },

  /** @param {DataProvider} dp */
  getStaticTraceProgramId(dp, staticTraceId) {
    const staticTrace = dp.collections.staticTraces.getById(staticTraceId);
    const {
      staticContextId
    } = staticTrace;

    const staticContext = dp.collections.staticContexts.getById(staticContextId);
    const { programId } = staticContext;
    return programId;
  },

  /** @param {DataProvider} dp */
  getTraceProgramId(dp, traceId) {
    const trace = dp.collections.traces.getById(traceId);

    const {
      staticTraceId,
    } = trace;

    return dp.util.getStaticTraceProgramId(staticTraceId);
  },

  /** @param {DataProvider} dp */
  getTraceFilePath(dp, traceId) {
    const programId = dp.util.getTraceProgramId(traceId);
    return programId && dp.util.getFilePathFromProgramId(programId) || null;
  },

  /** @param {DataProvider} dp */
  getTraceFileName(dp, traceId) {
    const programId = dp.util.getTraceProgramId(traceId);
    return programId && dp.collections.staticProgramContexts.getById(programId).fileName || null;
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
   * @param {DataProvider} dp 
   * @param {StaticTrace[]} staticTraces
  */
  groupTracesByType(dp, staticTraces) {
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
  // Contexts + their traces
  // ###########################################################################

  /**
   * Whether this is the last trace we have seen in its context.
   * NOTE: Ignores final `PopImmediate`.
   * @param {DataProvider} dp 
  */
  isLastTraceInRealContext(dp, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    const { contextId } = trace;
    return dp.util.getLastTraceInRealContext(contextId) === trace;
  },

  /**
   * Whether this is the last trace of its static context
   * NOTE: Ignores final `PopImmediate`.
   * @param {DataProvider} dp 
  */
  isLastStaticTraceInContext(dp, staticTraceId) {
    const staticTrace = dp.collections.staticTraces.getById(staticTraceId);
    const { staticContextId } = staticTrace;
    return dp.util.getLastStaticTraceInContext(staticContextId) === staticTrace;
  },

  /** @param {DataProvider} dp */
  getActualLastTraceInRealContext(dp, contextId) {
    const traces = dp.indexes.traces.byRealContext.get(contextId);
    return traces?.[traces.length - 1] || null;
  },

  /**
   * Whether this is the last trace we have seen in its context.
   * NOTE: Ignores final `PopImmediate`.
   * @param {DataProvider} dp 
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
   * @param {DataProvider} dp 
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

  /** @param {DataProvider} dp */
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

  // ###########################################################################
  // loc (locations)
  // ###########################################################################

  getTraceLoc(dp, traceId) {
    const { loc } = dp.util.getStaticTrace(traceId);
    return loc;
  },

  // ###########################################################################
  // code chunks
  // ###########################################################################

  getCodeChunkId(dp, traceId) {
    const { codeChunkId } = dp.util.getTrace(traceId);
    return codeChunkId;
  }

};
