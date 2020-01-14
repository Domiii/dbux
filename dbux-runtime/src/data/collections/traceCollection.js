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

  trace(contextId, inProgramStaticTraceId) {
    const trace = Trace.allocate();
    trace.traceId = this._traces.length;
    trace.contextId = contextId;
    trace._staticTraceId = inProgramStaticTraceId;

    this._traces.push(trace);

    _prettyPrint(trace);

    return trace;
  }

  traceExpressionWithValue(contextId, inProgramStaticTraceId, value) {
    const trace = Trace.allocate();
    trace.traceId = this._traces.length;
    trace.contextId = contextId;
    trace._staticTraceId = inProgramStaticTraceId;
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
  const { contextId, _staticTraceId, v, value } = trace;
  const context = executionContextCollection.getById(contextId);
  const {
    staticContextId,
    stackDepth
  } = context;

  const staticContext = staticContextCollection.getById(staticContextId);
  const { programId } = staticContext;

  const staticProgramContext = staticProgramContextCollection.getById(programId);

  const {
    fileName
  } = staticProgramContext;
  // const {
  // } = staticContext;

  // const staticTrace = staticTraceCollection.getById(staticTraceId);
  const staticTrace = staticTraceCollection.getTrace(programId, _staticTraceId);
  const {
    displayName,
    capturesValue
  } = staticTrace;
  const depthIndicator = ` `.repeat(stackDepth + 1);
  const {
    loc
  } = staticTrace;

  const where = v ? loc.end : loc.start;
  const codeLocation = `@${fileName}:${where.line}:${where.column}`;

  // if (capturesValue && !v) {
  //   console.group(displayName);
  // }
  // else {
  console.log(`${contextId} ${depthIndicator}${displayName}`, wrap(v, ' ('), wrap(v, value), wrap(v, ')'), ` ${codeLocation} [DBUX]`);
  // }
  // if (capturesValue && v) {
  //   console.groupEnd();
  // }
}

const traceCollection = new TraceCollection();
export default traceCollection;