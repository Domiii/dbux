import DataProvider from "./DataProvider";
import TraceType, { hasDynamicTypes, hasValue } from 'dbux-common/src/core/constants/TraceType';
import { pushArrayOfArray } from 'dbux-common/src/util/arrayUtil';

export default {
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
  getPreviousTraceInContext(dp: DataProvider, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    const traces = dp.indexes.traces.byContext.get(trace.contextId);
    if (!traces?.length) {
      return null;
    }
    const index = traces.indexOf(trace);
    if (index === 0) {
      if (traceId !== 1) traceId--;
      return dp.collections.traces.getById(traceId);
    }
    else return traces[index - 1];
  },
  getNextTraceInContext(dp: DataProvider, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    const traces = dp.indexes.traces.byContext.get(trace.contextId);
    if (!traces?.length) {
      return null;
    }
    const index = traces.indexOf(trace);
    if (index === traces.length - 1) {
      if (traceId !== dp.collections.traces.size) traceId++;
      return dp.collections.traces.getById(traceId);
    }
    else return traces[index + 1];
  },

  doesTraceHaveValue(dp: DataProvider, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    const { staticTraceId, type: dynamicType } = trace;
    const staticTrace = dp.collections.staticTraces.getById(staticTraceId);
    const { type: staticType } = staticTrace;
    return hasValue(dynamicType || staticType);
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
    const {
      contextId
    } = trace;
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

  /**
   * TODO: improve performance, use index instead
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
          const traces = traceGroups[type];
          if (traces) {
            pushArrayOfArray(groups, type, [staticTrace, traces]);
          }
        }
      }
    }
    return groups;
  }
};
