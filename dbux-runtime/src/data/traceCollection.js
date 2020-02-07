import staticTraceCollection from './staticTraceCollection';
import executionContextCollection from './executionContextCollection';
import staticContextCollection from './staticContextCollection';
import Collection from './Collection';
import pools from './pools';
import valueCollection from './valueCollection';


class TraceCollection extends Collection {
  constructor() {
    super('traces');
  }

  trace(contextId, runId, inProgramStaticTraceId, type = null) {
    const trace = this._trace(contextId, runId, inProgramStaticTraceId, type, false, undefined);
    return trace;
  }

  traceExpressionResult(contextId, runId, inProgramStaticTraceId, value) {
    const trace = this._trace(contextId, runId, inProgramStaticTraceId, null, true, value);
    return trace;
  }

  _trace(contextId, runId, inProgramStaticTraceId, type, hasValue, value) {
    if (!inProgramStaticTraceId) {
      throw new Error('missing inProgramStaticTraceId');
    }

    const trace = pools.traces.allocate();
    trace.contextId = contextId;
    trace.runId = runId;
    trace.type = type;

    // value
    valueCollection.processValue(hasValue, value, trace);

    // look-up globally unique staticTraceId
    // trace._staticTraceId = inProgramStaticTraceId;
    const context = executionContextCollection.getById(contextId);
    const {
      staticContextId
    } = context;
    const staticContext = staticContextCollection.getById(staticContextId);
    const {
      programId
    } = staticContext;
    trace.staticTraceId = staticTraceCollection.getStaticTraceId(programId, inProgramStaticTraceId);

    // generate new traceId and store
    trace.traceId = this._all.length;
    
    this._all.push(trace);
    this._send(trace);

    // _prettyPrint(trace, value);

    return trace;
  }
}

// function _prettyPrint(trace, value) {
//   const { 
//     contextId, 
//     type: dynamicType,
//     staticTraceId, 
//     // value 
//   } = trace;
//   const context = executionContextCollection.getById(contextId);
  
//   const {
//     staticContextId,
//     stackDepth
//   } = context;

//   const staticContext = staticContextCollection.getById(staticContextId);
//   const { programId } = staticContext;

//   const staticProgramContext = staticProgramContextCollection.getById(programId);

//   const {
//     fileName
//   } = staticProgramContext;
//   // const {
//   // } = staticContext;

//   const staticTrace = staticTraceCollection.getById(staticTraceId);
//   let {
//     displayName,
//     type: staticType,
//     loc
//   } = staticTrace;

//   const type = dynamicType || staticType; // if `dynamicType` is given take that, else `staticType`
//   const typeName = TraceType.nameFromForce(type);

//   const depthIndicator = ` `.repeat(stackDepth * 2);
//   const where = loc.start;
//   const codeLocation = `@${fileName}:${where.line}:${where.column}`;

//   displayName = displayName || '';

//   // if (capturesValue && !v) {
//   //   console.group(displayName);
//   // }
//   // else

//   // TODO: if we want to keep using this; fix to use `ValueCollection` instead
//   const v = type === TraceType.ExpressionResult;
//   const result = v ? ['(', value, ')'] : EmptyArray;
//   console.debug(
//     `${contextId} ${depthIndicator}[${typeName}] ${displayName}`, 
//     ...result, 
//     ` ${codeLocation} [DBUX]`
//   );
//   // }
//   // if (capturesValue && v) {
//   //   console.groupEnd();
//   // }
// }

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