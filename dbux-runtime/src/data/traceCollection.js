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

  trace(programId, contextId, runId, inProgramStaticTraceId, type = null) {
    const trace = this._trace(programId, contextId, runId, inProgramStaticTraceId, type, false, undefined);
    return trace;
  }

  /**
   * Expression + pop traces have results
   */
  traceWithResultValue(programId, contextId, runId, inProgramStaticTraceId, type, value, valuesDisabled) {
    const trace = this._trace(programId, contextId, runId, inProgramStaticTraceId, type, true, value, valuesDisabled);
    return trace;
  }

  _trace(programId, contextId, runId, inProgramStaticTraceId, type, hasValue, value, valuesDisabled) {
    if (!inProgramStaticTraceId) {
      throw new Error('missing inProgramStaticTraceId');
    }

    const trace = pools.traces.allocate();
    // generate new traceId and store
    trace.traceId = this._all.length;
    this._all.push(trace);
    
    trace.contextId = contextId;
    trace.runId = runId;
    trace.type = type;
    trace.createdAt = Date.now();  // { createdAt }

    // value
    valueCollection.registerValueMaybe(hasValue, value, trace, valuesDisabled);

    // look-up globally unique staticTraceId
    
    // const programId = executionContextCollection.getProgramId(contextId);
    trace.staticTraceId = staticTraceCollection.getStaticTraceId(programId, inProgramStaticTraceId);

    this._send(trace);

    // _prettyPrint(trace, value);

    return trace;
  }

  // ########################################
  // dynamic updates
  // ########################################
  // markError(traceId) {
  //   const trace = traceCollection.getById(traceId);
  // }
}

// ###########################################################################
// prettyPrint
// ###########################################################################

// function _prettyPrint(trace, value) {
//   const {
//     traceId,
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
//   const v = hasTraceValue(type);
//   const result = v ? ['(', value, ')'] : EmptyArray;
//   console.debug('', traceId, contextId,
//     `${depthIndicator}[${typeName}] ${displayName}`,
//     ...result,
//     ` ${codeLocation} [Dbux]`
//   );
//   // }
//   // if (capturesValue && v) {
//   //   console.groupEnd();
//   // }
// }

// ###########################################################################
// export
// ###########################################################################

/**
 * @type {TraceCollection}
 */
const traceCollection = new TraceCollection();
export default traceCollection;