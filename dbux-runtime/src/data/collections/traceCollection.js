import TraceType, { isTracePush, isTracePop } from 'dbux-common/src/core/constants/TraceType';
import staticTraceCollection from './staticTraceCollection';
import executionContextCollection from './executionContextCollection';
import staticContextCollection from './staticContextCollection';
import staticProgramContextCollection from './staticProgramContextCollection';
import { logInternalError } from 'dbux-common/src/log/logger';
import { EmptyArray } from 'dbux-common/src/util/misc';


class Trace {
  static allocate() {
    // TODO: use object pooling
    return new Trace();
  }
}


class TraceCollection {
  _all = [null];

  trace(contextId, inProgramStaticTraceId, type = null) {
    const trace = this._trace(contextId, inProgramStaticTraceId);
    trace.type = type;

    return trace;
  }

  traceExpressionWithValue(contextId, inProgramStaticTraceId, value) {
    const trace = this._trace(contextId, inProgramStaticTraceId);
    trace.type = null; // available in static trace data
    trace.value = value;

    return trace;
  }

  _trace(contextId, inProgramStaticTraceId) {
    if (!inProgramStaticTraceId) {
      throw new Error('missing inProgramStaticTraceId');
    }

    const trace = Trace.allocate();
    trace.contextId = contextId;

    // look-up global trace id by in-program id
    // trace._staticTraceId = inProgramStaticTraceId;
    const context = executionContextCollection.getById(contextId);
    const {
      programId
    } = context;
    trace.staticTraceId = staticTraceCollection.getTraceId(programId, inProgramStaticTraceId);

    // generate new traceId and store
    trace.traceId = this._all.length;
    this._all.push(trace);

    _prettyPrint(trace);

    return this.trace;
  }

}

function _prettyPrint(trace) {
  const { 
    contextId, 
    type: dynamicType,
    staticTraceId, 
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

  const staticTrace = staticTraceCollection.getById(staticTraceId);
  let {
    displayName,
    type: staticType,
    loc
  } = staticTrace;

  const type = dynamicType || staticType; // if `dynamicType` is given take that, else `staticType`

  const depthIndicator = ` `.repeat(stackDepth * 2);
  const typeName = TraceType.nameFromForce(type);
  const where = loc.start;
  const codeLocation = `@${fileName}:${where.line}:${where.column}`;

  displayName = displayName || '';

  // if (capturesValue && !v) {
  //   console.group(displayName);
  // }
  // else
  const v = type === TraceType.ExpressionResult;
  const result = v ? ['(', _inspect(value), ')'] : EmptyArray;
  console.log(
    `${contextId} ${depthIndicator}[${typeName}] ${displayName}`, 
    ...result, 
    ` ${codeLocation} [DBUX]`
  );
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