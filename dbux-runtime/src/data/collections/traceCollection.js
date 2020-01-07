import staticTraceCollection from './staticTraceCollection';
import executionContextCollection from './executionContextCollection';
import staticContextCollection from './staticContextCollection';

class Trace {
  static allocate() {
    // TODO: use object pooling
    return new Trace();
  }
}

class TraceCollection {
  _traces = [null];

  recordTrace(contextId, staticTraceId) {
    const trace = Trace.allocate();
    trace.traceId = this._traces.length;
    trace.contextId = contextId;
    trace.staticTraceId = staticTraceId;

    this._traces.push(trace);

    _prettyPrint(trace);

    return trace;
  }

  recordTraceWithValue(contextId, staticTraceId, value) {
    const trace = Trace.allocate();
    trace.traceId = this._traces.length;
    trace.contextId = contextId;
    trace.staticTraceId = staticTraceId;
    trace.value = value;
    trace.v = true;

    this._traces.push(trace);

    _prettyPrint(trace);

    return trace;
  }

}

function wrap(v, s) {
  return v && s || '';
}

function _prettyPrint(trace) {
  const { contextId, staticTraceId, v, value } = trace;
  const context = executionContextCollection.getContext(contextId);
  const { 
    programId,
    stackDepth
   } = context;
  // const staticContext = staticContextCollection.getContext()
  const staticTrace = staticTraceCollection.getTrace(programId, staticTraceId);
  const { 
    displayName,
    capturesValue
  } = staticTrace;
  const depthIndicator = ` `.repeat(stackDepth+1);
  // if (capturesValue && !v) {
  //   console.group(displayName);
  // }
  // else {
    console.log(`${contextId} ${depthIndicator}${displayName}`, wrap(v, ' ('), wrap(v, value), wrap(v, ') [DBUX]'));
  // }
  // if (capturesValue && v) {
  //   console.groupEnd();
  // }
}

const traceCollection = new TraceCollection();
export default traceCollection;