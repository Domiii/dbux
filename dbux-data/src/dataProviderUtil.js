import { hasDynamicTypes, hasValue } from 'dbux-common/src/core/constants/TraceType';
import { pushArrayOfArray } from 'dbux-common/src/util/arrayUtil';
import Trace from 'dbux-common/src/core/data/Trace';
import DataProvider from './DataProvider';
import { newLogger } from 'dbux-common/src/log/logger';

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
    while (true) {
      parentContextId = executionContexts.getById(lastContextId).parentContextId;
      if (!parentContextId) return lastContextId;
      else lastContextId = parentContextId;
    }
  },

  getFirstContextsInRuns(dp: DataProvider) {
    return dp.indexes.executionContexts.firstInRuns.get(1);
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

  doesTraceHaveValue(dp: DataProvider, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    const { staticTraceId, type: dynamicType } = trace;
    if (dynamicType) {
      return hasValue(dynamicType);
    }
    return dp.util.doesStaticTraceHaveValue(staticTraceId);
  },

  doesStaticTraceHaveValue(dp: DataProvider, staticTraceId) {
    const staticTrace = dp.collections.staticTraces.getById(staticTraceId);
    return hasValue(staticTrace.type);
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

  getTraceContext(dp: DataProvider, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    const { contextId } = trace;
    return dp.collections.executionContexts.getById(contextId);
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

  getTraceStaticContextId(dp: DataProvider, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    const { staticTraceId } = trace;
    const staticTrace = dp.collections.staticTraces.getById(staticTraceId);
    const { staticContextId } = staticTrace;
    return staticContextId;
  },

  getCalleeTrace(dp: DataProvider, traceId) {
    const argTrace = dp.collections.traces.getById(traceId);
    const { staticTraceId } = argTrace;
    const staticTrace = dp.collections.staticTraces.getById(staticTraceId);
    const { calleeId: calleeStaticId } = staticTrace;

    // const calleeStaticTrace = dp.collections.staticTraces.getById(calleeStaticId);
    if (calleeStaticId) {
      // iterate over all previous arguments until we found callee
      let trace;
      for (; traceId > 0 && (trace = dp.collections.traces.getById(traceId)); --traceId) {
        if (trace.staticTraceId === calleeStaticId) {
          return trace;
        }
      }
    }
    return null;
  },

  getCalleeStaticTrace(dp: DataProvider, traceId) {
    const argTrace = dp.collections.traces.getById(traceId);
    const { staticTraceId } = argTrace;
    const staticTrace = dp.collections.staticTraces.getById(staticTraceId);
    const { calleeId: calleeStaticId } = staticTrace;

    return calleeStaticId && dp.collections.staticTraces.getById(calleeStaticId) || null;
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
  }
};