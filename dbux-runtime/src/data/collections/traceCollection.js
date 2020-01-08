import staticTraceCollection from './staticTraceCollection';
import executionContextCollection from './executionContextCollection';
import staticContextCollection from './staticContextCollection';
import staticProgramContextCollection from './staticProgramContextCollection';

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

function wrap(v, output) {
  return v ? output : '';
}

function _prettyPrint(trace) {
  const { contextId, staticTraceId, v, value } = trace;
  const context = executionContextCollection.getContext(contextId);
  const {
    programId,
    staticContextId,
    stackDepth
  } = context;

  const staticProgramContext = staticProgramContextCollection.getProgramContext(programId);
  const staticContext = staticContextCollection.getContext(programId, staticContextId);

  const {
    fileName
  } = staticProgramContext;
  const {
    loc
  } = staticContext;

  const staticTrace = staticTraceCollection.getTrace(programId, staticTraceId);
  const {
    displayName,
    capturesValue
  } = staticTrace;
  const depthIndicator = ` `.repeat(stackDepth + 1);
  
  const where = v ? loc.end : loc.start;
  const codeLocation = `@${fileName}:${where.line}:${where.col}`;

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