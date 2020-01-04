class Trace {
  static allocate() {
    // TODO: use object pooling
    return new Trace();
  }
}

class TraceCollection {
  _traces = [];

  recordTrace(contextId, traceId, value) {
    const trace = Trace.allocate();
    trace.contextId = contextId;
    trace.value = value;
    trace.traceId = traceId;

    this._traces.push(trace);
    return trace;
  }
}

const traceCollection = new TraceCollection();
export default traceCollection;