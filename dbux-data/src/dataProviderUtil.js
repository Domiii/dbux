export default {
  getLastTraceOfContext(contextId) {
    const traces = dp.indexes.tracesByContext.get(contextId);
    if (!traces?.length) {
      return null;
    }
    return traces[traces.length-1];
  }
};
