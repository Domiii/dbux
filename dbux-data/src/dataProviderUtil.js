import { hasDynamicTypes, hasValue } from 'dbux-common/src/core/constants/TraceType';
import { pushArrayOfArray } from 'dbux-common/src/util/arrayUtil';
import Trace from 'dbux-common/src/core/data/Trace';
import DataProvider from './DataProvider';

export default {
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

  // ########################################
  // main playback functions
  // ########################################

  getNextTrace(dp: DataProvider, traceId) {
    const { traces } = dp.collections;
    return traces.getById(traceId + 1) || null;
  },

  getPreviousTrace(dp: DataProvider, traceId) {
    const { traces } = dp.collections;
    return traces.getById(traceId - 1) || null;
  },

  /**
   * @param {DataProvider} dp 
   * @param {Trace} trace 
   */
  getPreviousTraceInContext(dp, trace) {
    const traces = dp.indexes.traces.byContext.get(trace.contextId);
    if (!traces?.length) return null;

    const binarySearch = (left, right) => {
      const middle = Math.floor((left + right) / 2);
      if (trace === traces[middle]) return middle;
      if (left + 1 === right) return (traces[left] === trace) ? left : right;
      if (traces[middle].traceId < trace.traceId) return binarySearch(middle, right);
      if (trace.traceId < traces[middle].traceId) return binarySearch(left, middle);
      throw Error('No return value in binarySearch.');
    };

    const indexInTracesInTraces = binarySearch(0, traces.length - 1);
    if (indexInTracesInTraces === 0) return trace;
    else return traces[indexInTracesInTraces - 1];
  },

  /**
   * @param {DataProvider} dp 
   * @param {Trace} trace 
   */
  getNextTraceInContext(dp, trace) {
    const traces = dp.indexes.traces.byContext.get(trace.contextId);
    if (!traces?.length) return null;

    const binarySearch = (left, right) => {
      const middle = Math.floor((left + right) / 2);
      if (trace === traces[middle]) return middle;
      if (left + 1 === right) return (traces[left] === trace) ? left : right;
      if (traces[middle].traceId < trace.traceId) return binarySearch(middle, right);
      if (trace.traceId < traces[middle].traceId) return binarySearch(left, middle);
      throw Error('No return value in binarySearch.');
    };

    const indexInTracesInTraces = binarySearch(0, traces.length - 1);
    if (indexInTracesInTraces === traces.length - 1) return trace;
    else return traces[indexInTracesInTraces + 1];
  },

  /**
   * @param {DataProvider} dp 
   * @param {Trace} trace 
   */
  getPreviousTraceInParentContext(dp, trace) {
    const traces = dp.indexes.traces.byContext.get(trace.contextId);
    if (trace === traces[0]) {
      return dp.collections.traces.getById(trace.traceId - 1) || trace;
    }
    else return traces[0];
  },

  /**
   * @param {DataProvider} dp 
   * @param {Trace} trace 
   */
  getNextTraceInParentContext(dp, trace) {
    const traces = dp.indexes.traces.byContext.get(trace.contextId);
    if (trace === traces[traces.length - 1]) {
      return dp.collections.traces.getById(trace.traceId + 1) || trace;
    }
    else return traces[traces.length - 1];
  },

  // ########################################
  // others
  // ########################################

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

  getFirstContextsInRuns(dp: DataProvider) {
    return dp.indexes.executionContexts.firstInRuns.get(1);
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

  getFilePathFromProgramId(dp: DataProvider, programId) {
    return dp.collections.staticProgramContexts.getById(programId)?.filePath || null;
  },

  getTraceStaticContextId(dp: DataProvider, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    const { staticTraceId } = trace;
    const staticTrace = dp.collections.staticTraces.getById(staticTraceId);
    const { staticContextId } = staticTrace;
    return staticContextId;
  },

  /**
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