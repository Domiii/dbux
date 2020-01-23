import DataProvider from "./DataProvider";

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
    return traces[traces.length-1];
  },
  getPreviousTraceInContext(dp: DataProvider, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    const traces = dp.indexes.traces.byContext.get(trace.contextId);
    if (!traces?.length) {
      return null;
    }
    const index = traces.indexOf(trace);
    if (index === 0){
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
    if (index === traces.length - 1){
      if (traceId !== dp.collections.traces.size) traceId++;
      return dp.collections.traces.getById(traceId);
    }
    else return traces[index + 1];
  }
};
