import { newLogger } from '@dbux/common/src/log/logger';
import staticTraceCollection from './staticTraceCollection';
import Collection from './Collection';
import pools from './pools';

const { log, debug, warn, error: logError } = newLogger('Traces');

class TraceCollection extends Collection {
  constructor() {
    super('traces');
  }

  getDataNodeIdByTraceId(traceId) {
    return this.getById(traceId).nodeId;
  }

  getDataNodeIdsByTraceIds(traceIds) {
    if (!traceIds) {
      return null;
    }
    return traceIds.map(traceId => {
      const trace = this.getById(traceId);
      if (!trace) {
        warn(`could not lookup trace of traceId=${traceId}`);
        return null;
      }
      return trace.nodeId;
    });
  }

  getStaticTraceByTraceId(traceId) {
    const trace = this.getById(traceId);
    return staticTraceCollection.getById(trace.staticTraceId);
  }

  trace(programId, contextId, runId, inProgramStaticTraceId, type = null) {
    if (!inProgramStaticTraceId) {
      throw new Error('missing inProgramStaticTraceId');
    }

    const trace = pools.traces.allocate();
    trace.traceId = this._all.length;
    this.push(trace);

    // // eslint-disable-next-line no-console
    // console.debug(`${this._all.length} ${trace.traceId}`);

    trace.contextId = contextId;
    trace.runId = runId;
    trace.type = type;
    trace.createdAt = Date.now();  // { createdAt }

    // look-up globally unique staticTraceId

    // const programId = executionContextCollection.getProgramId(contextId);
    // trace._inProgramStaticTraceId = inProgramStaticTraceId;
    trace.staticTraceId = staticTraceCollection.getStaticTraceId(programId, inProgramStaticTraceId);

    this._send(trace);

    // if (trace.traceId < 30) {
    // _prettyPrint(trace);
    // }

    return trace;
  }

  // ########################################
  // dynamic updates
  // ########################################
  // markError(traceId) {
  //   const trace = traceCollection.getById(traceId);
  // }
}

// // ###########################################################################
// // prettyPrint
// // ###########################################################################

// function _prettyPrint(trace) {
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
//   // const v = hasTraceValue(type);
//   // const result = v ? ['(', value, ')'] : EmptyArray;
//   // eslint-disable-next-line no-console
//   debug(`t=${traceId}, c=${contextId}, st=${staticTraceId}`,
//     `  ${typeName} ${depthIndicator} ${displayName}`,
//     // ...result,
//     ` ${codeLocation}`
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