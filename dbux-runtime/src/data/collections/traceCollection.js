import TraceType, { isTracePush, isTracePop } from 'dbux-common/src/core/constants/TraceType';
import staticTraceCollection from './staticTraceCollection';
import executionContextCollection from './executionContextCollection';
import staticContextCollection from './staticContextCollection';
import staticProgramContextCollection from './staticProgramContextCollection';
import { logInternalError } from '../../log/logger';


class Trace {
  static allocate() {
    // TODO: use object pooling
    return new Trace();
  }
}


class TraceCollection {
  _traces = [null];

  trace(contextId, inProgramStaticTraceId, type = null) {
    if (!inProgramStaticTraceId) {
      throw new Error('missing inProgramStaticTraceId');
    }

    const trace = Trace.allocate();
    trace.traceId = this._traces.length;
    trace.contextId = contextId;
    trace.type = type;
    trace._staticTraceId = inProgramStaticTraceId;

    this._traces.push(trace);

    _prettyPrint(trace);

    return trace;
  }

  traceExpressionWithValue(contextId, inProgramStaticTraceId, value) {
    if (!inProgramStaticTraceId) {
      throw new Error('missing inProgramStaticTraceId');
    }
    
    const trace = Trace.allocate();
    trace.traceId = this._traces.length;
    trace.contextId = contextId;
    trace.type = null; // available in static trace data
    trace._staticTraceId = inProgramStaticTraceId;
    trace.value = value;

    this._traces.push(trace);

    _prettyPrint(trace);

    return trace;
  }

}

function wrapValueOnly(v, output) {
  return v ? output : '';
}

function _prettyPrint(trace) {
  const { 
    contextId, 
    type: dynamicType,
    _staticTraceId, 
    value 
  } = trace;
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
  let {
    displayName,
    type: staticType,
    loc
  } = staticTrace;

  const type = dynamicType || staticType; // if `dynamicType` is given take that, else `staticType`

  const depthIndicator = ` `.repeat(stackDepth + 1);
  const typeName = TraceType.nameFromForce(type);
  const where = loc.start;
  const codeLocation = `@${fileName}:${where.line}:${where.column}`;

  displayName = displayName || '';

  // if (capturesValue && !v) {
  //   console.group(displayName);
  // }
  // else
  const v = type === TraceType.ExpressionResult;
  console.log(`${contextId} ${depthIndicator}[${typeName}] ${displayName}`, wrapValueOnly(v, ' ('), wrapValueOnly(v, value), wrapValueOnly(v, ')'), ` ${codeLocation} [DBUX]`);
  // }
  // if (capturesValue && v) {
  //   console.groupEnd();
  // }
}


const traceCollection = new TraceCollection();
export default traceCollection;




// static prettyPrintEvent(event) {
//   const {
//     eventType,
//     contextId,
//     where
//   } = event;

//   const typeName = ExecutionEventType.nameFrom(eventType);
//   const context = executionContextCollection.getById(contextId);

//   const {
//     staticContextId,
//     parentContextId,
//     stackDepth
//   } = context;
//   const staticContext = staticContextCollection.getById(staticContextId);

//   const {
//     displayName,
//     programId
//   } = staticContext;
//   const staticProgramContext = staticProgramContextCollection.getById(programId);

//   const {
//     fileName,
//     // filePath
//   } = staticProgramContext;

//   const line = where?.line;
//   const lineSuffix = line ? `:${line}` : '';
//   const codeLocation = `@${fileName}${lineSuffix}`;
//   // const depthIndicator = `(${parentContextId})`;
//   const depthIndicator = ` `.repeat(stackDepth);
//   // const depthIndicator = ''; // we are using `console.group` for this for now
//   let message = `${contextId} ${depthIndicator}${displayName} [${typeName}] ${codeLocation} (${parentContextId}) [DBUX]`;


//   if (!timer) {
//     message = '       ---------------\n' + message;
//     // else if (isPopEvent(eventType)) {
//     //   message = message + '\n       ---------------';
//     // }
//   }

//   if (isPushEvent(eventType)) {
//     // console.group(contextId);
//   }
//   // console.debug('%c' + message, 'color: lightgray');
//   console.debug(message);
//   if (isPopEvent(eventType)) {
//     // console.groupEnd();
//   }

//   // (pretty accurate) hackfix: simulate end of (partial) stack
//   if (!timer) {
//     timer = setImmediate(() => {
//       console.log('       ---------------\n');
//       timer = null;
//     });
//   }
// }