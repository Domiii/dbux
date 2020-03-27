import { hasDynamicTypes, hasTraceValue, isReturnTrace, isTracePop } from 'dbux-common/src/core/constants/TraceType';
import { pushArrayOfArray, EmptyArray } from 'dbux-common/src/util/arrayUtil';
import { newLogger } from 'dbux-common/src/log/logger';
import { isVirtualContextType } from 'dbux-common/src/core/constants/StaticContextType';
import DataProvider from './DataProvider';
import { isRealContextType } from '../../dbux-common/src/core/constants/ExecutionContextType';

const { log, debug, warn, error: logError } = newLogger('dataProviderUtil');

export default {

  // ###########################################################################
  // Program utils
  // ###########################################################################

  getFilePathFromProgramId(dp: DataProvider, programId) {
    return dp.collections.staticProgramContexts.getById(programId)?.filePath || null;
  },

  // ###########################################################################
  // root contexts
  // ###########################################################################

  getAllRootContexts(dp: DataProvider) {
    return dp.indexes.executionContexts.roots.get(1);
  },

  getRootContextIdByContextId(dp: DataProvider, contextId) {
    const { executionContexts } = dp.collections;
    let lastContextId = contextId;
    let parentContextId;
    // TODO: avoid using while(true)
    while (true) {
      parentContextId = executionContexts.getById(lastContextId).parentContextId;
      if (!parentContextId) return lastContextId;
      else lastContextId = parentContextId;
    }
  },

  getFirstContextsInRuns(dp: DataProvider) {
    return dp.indexes.executionContexts.firstInRuns.get(1);
  },

  getFirstTracesInRuns(dp: DataProvider) {
    return dp.indexes.traces.firsts.get(1);
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

  getFirstTraceOfRun(dp: DataProvider, runId) {
    const traces = dp.indexes.traces.byRunId.get(runId);
    if (!traces?.length) {
      return null;
    }
    return traces[0];
  },

  getLastTraceOfRun(dp: DataProvider, runId) {
    const traces = dp.indexes.traces.byRunId.get(runId);
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
    const { valueId } = trace;

    if (valueId) {
      // value is reference type
      const ref = dp.collections.values.getById(valueId);
      return ref.value;
    }

    // value is primitive type (or trace has no value)
    return trace.value;
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
    const { contextType, parentContextId } = context;

    if (isRealContextType(contextType)) return contextId;
    else {
      const parentContext = dp.collections.executionContexts.getById(parentContextId);
      const { contextType: parentContextType } = parentContext;
      if (parentContext && isRealContextType(parentContextType)) return parentContextId;
      else {
        logError('Could not find realContext.');
        debugger;
        return null;
      }
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

  getTraceStaticContext(dp: DataProvider, traceId) {
    const context = dp.util.getTraceContext(traceId);
    const {
      staticContextId
    } = context;
    return dp.collections.staticContexts.getById(staticContextId);
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
    const trace = dp.collections.traces.getById(traceId);
    const { staticTraceId } = trace;
    const context = dp.collections.contexts.getById(staticTraceId);
    const { staticContextId } = context;
    return staticContextId;
  },

  getCalleeTraceOfArg(dp: DataProvider, traceId) {
    const argTrace = dp.collections.traces.getById(traceId);
    const { callId } = argTrace;

    return callId && dp.collections.traces.getById(callId) || null;
  },

  getCalleeStaticTrace(dp: DataProvider, traceId) {
    const argTrace = dp.collections.traces.getById(traceId);
    const { staticTraceId } = argTrace;
    const staticTrace = dp.collections.staticTraces.getById(staticTraceId);
    const { callId: callStaticId } = staticTrace;

    return callStaticId && dp.collections.staticTraces.getById(callStaticId) || null;
  },

  getCallResultTrace(dp: DataProvider, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    if (trace.resultId) return trace;
    if (trace.callId) return dp.util.getCallResultTrace(trace.callId);
    if (trace.schedulerTraceId) return dp.util.getCallResultTrace(trace.schedulerTraceId);

    // Not a call related trace or is already a result trace
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

  isErrorTrace(dp, traceId) {
    // ` && `getLastTraceInRealContext.staticTrace` !== ``getLastStaticTraceInRealContext

    const trace = dp.collections.traces.getById(traceId);
    const { staticTraceId } = trace;
    const traceType = dp.util.getTraceType(traceId);

    console.log('errorTrace', !isReturnTrace(traceType),

      traceId, staticTraceId,
      dp.util.getRealContextId(traceId),

      dp.util.getLastTraceInRealContext(dp.util.getRealContextId(traceId))?.traceId,
      dp.util.getLastStaticTraceInContext(dp.collections.staticTraces.getById(staticTraceId).staticContextId)?.staticTraceId,

      // is last trace we have recorded in context
      dp.util.isLastTraceInRealContext(traceId),

      // but is not last trace in the code
      !dp.util.isLastStaticTraceInContext(staticTraceId),

      // the context must have popped (finished), or else there was no error (yet)
      dp.util.hasRealContextPopped(dp.util.getRealContextId(traceId)));

    // is not a return trace (because return traces indicate function succeeded)
    return !isReturnTrace(traceType) &&

      // is last trace we have recorded in context
      dp.util.isLastTraceInRealContext(traceId) &&

      // but is not last trace in the code
      !dp.util.isLastStaticTraceInContext(staticTraceId) &&

      // the context must have popped (finished), or else there was no error (yet)
      dp.util.hasRealContextPopped(dp.util.getRealContextId(traceId));
  },

  hasContextError(dp, realContextId) {
    const trace = dp.util.getLastTraceInRealContext(realContextId);
    return dp.util.isErrorTrace(trace);
  },
};