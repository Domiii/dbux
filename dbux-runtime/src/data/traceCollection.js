import { newLogger } from '@dbux/common/src/log/logger';
import TraceType from '@dbux/common/src/core/constants/TraceType';
import staticTraceCollection from './staticTraceCollection';
import Collection from './Collection';
import pools from './pools';
import { locToString } from '../util/locUtil';
import staticContextCollection from './staticContextCollection';
import staticProgramContextCollection from './staticProgramContextCollection';

const { log, debug, warn, error: logError } = newLogger('TraceCollection');

class TraceCollection extends Collection {
  constructor() {
    super('traces');
  }

  getDataNodeIdByTraceId(traceId) {
    return this.getById(traceId).nodeId;
  }

  getDataNodeIdsByTraceIds(tid, traceIds) {
    if (!traceIds) {
      return null;
    }
    return traceIds.map(traceId => {
      const trace = this.getById(traceId);
      if (!trace) {
        // NOTE: this is as intended.
        //      Can happen when a LogicalExpression does not execute both sides (e.g. `te(1) || te(2)` will not execute `te(2)`)
        //      Or from ConditionalExpression (e.g. `x ? a : b`, will only execute either `a` or `b`)

        // const traceInfo = this.makeTraceInfo(tid);
        // warn(new Error(`Could not lookup trace of traceId=${traceId} in getDataNodeIdsByTraceIds([${traceIds.join(', ')}])\n  at trace #${tid}: ${traceInfo} `));
        return null;
      }
      return trace.nodeId;
    }).filter(id => !!id);
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

  // ###########################################################################
  // util
  // ###########################################################################

  makeStaticTraceInfo(staticTraceId) {
    const { displayName, loc, staticContextId } = staticTraceCollection.getById(staticTraceId);
    const staticContext = staticContextCollection.getById(staticContextId);
    const { programId } = staticContext;

    const fpath = staticProgramContextCollection.getById(programId)?.filePath || null;
    const where = `${fpath}:${locToString(loc)}`;

    return `at ${where}: "${displayName}"`;
  }

  /**
   * 
   */
  makeTraceInfo(traceId) {
    // const { traceId } = trace;
    // const trace = this.dp.collections.traces.getById(traceId);
    const { staticTraceId, type: dynamicType } = this.getById(traceId);
    const { type: staticType } = staticTraceCollection.getById(staticTraceId);
    const traceType = dynamicType || staticType;
    const typeName = TraceType.nameFrom(traceType);
    return `[${typeName}] #${traceId} (stid=${staticTraceId}) ${this.makeStaticTraceInfo(staticTraceId)}`;
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