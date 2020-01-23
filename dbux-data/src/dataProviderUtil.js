export default {
  getLastTraceOfContext(contextId) {
    const traces = this.indexes.tracesByContext.get(contextId);
    if (!traces?.length) {
      return null;
    }
    return traces[traces.length-1];
  }
};
