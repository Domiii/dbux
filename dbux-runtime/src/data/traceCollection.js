import TraceType, {  } from 'dbux-common/src/core/constants/TraceType';
import staticTraceCollection from './staticTraceCollection';
import executionContextCollection from './executionContextCollection';
import staticContextCollection from './staticContextCollection';
import staticProgramContextCollection from './staticProgramContextCollection';
import { logInternalError } from 'dbux-common/src/log/logger';
import { EmptyArray } from 'dbux-common/src/util/misc';
import Collection from './Collection';

const inspectOptions = { depth: 0, colors: true };
function _inspect(arg) {
  const f = typeof window !== 'undefined' && window.inspect ? window.inspect : require('util').inspect;
  return f(arg, inspectOptions);
}


/**
 * Recorded objects need careful handling:
 * Since we might not send them out immediately, they can change over time, so we need to copy a snapshot
 */
function processValue(value) {
  // serialize a copy of value
  return JSON.stringify(value);
}

class TraceCollection extends Collection {
  constructor() {
    super('traces');
  }

  trace(contextId, inProgramStaticTraceId, type = null) {
    const trace = this._trace(contextId, inProgramStaticTraceId, type, null, null);
    return trace;
  }

  traceExpressionWithValue(contextId, inProgramStaticTraceId, value) {
    const trace = this._trace(contextId, inProgramStaticTraceId, null, value, processValue(value));
    return trace;
  }

  _trace(contextId, inProgramStaticTraceId, type, value, processedValue) {
    if (!inProgramStaticTraceId) {
      throw new Error('missing inProgramStaticTraceId');
    }

    const trace = Trace.allocate();
    trace.contextId = contextId;
    trace.type = type;
    trace.value = processedValue;

    // look-up global trace id by in-program id
    // trace._staticTraceId = inProgramStaticTraceId;
    const context = executionContextCollection.getById(contextId);
    const {
      staticContextId
    } = context;
    const staticContext = staticContextCollection.getById(staticContextId);
    const {
      programId
    } = staticContext;
    trace.staticTraceId = staticTraceCollection.getTraceId(programId, inProgramStaticTraceId);

    // generate new traceId and store
    trace.traceId = this._all.length;
    
    this._all.push(trace);
    this.send(trace);

    _prettyPrint(trace, value);

    return trace;
  }

}

function _prettyPrint(trace, value) {
  const { 
    contextId, 
    type: dynamicType,
    staticTraceId, 
    // value 
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
  const result = v ? ['(', value, ')'] : EmptyArray;
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

/**
 * @type {TraceCollection}
 */
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