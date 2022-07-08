import { isFunctionDefinitionTrace } from '@dbux/common/src/types/constants/TraceType';
import { hasCallId, isCallResult } from '@dbux/common/src/types/constants/traceCategorization';
import ExecutionContext from '@dbux/common/src/types/ExecutionContext';
import SpecialCallType from '@dbux/common/src/types/constants/SpecialCallType';
import Trace from '@dbux/common/src/types/Trace';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import DataNodeType from '@dbux/common/src/types/constants/DataNodeType';
import isFunction from 'lodash/isFunction';
import dataNodeCollection from './dataNodeCollection';
import executionContextCollection from './executionContextCollection';
import staticTraceCollection from './staticTraceCollection';
import traceCollection from './traceCollection';
import valueCollection from './valueCollection';


// ###########################################################################
// BCE + callees
// ###########################################################################

function isSameFunction(a, b) {
  return a && a?.refId === b?.refId;
}

export function getFunctionStaticContextId(functionRef) {
  const functionNode = functionRef && dataNodeCollection.getById(functionRef.nodeId);
  const functionTrace = functionNode && traceCollection.getById(functionNode.traceId);
  const functionStaticTrace = functionTrace && staticTraceCollection.getById(functionTrace.staticTraceId);
  return functionStaticTrace?.data?.staticContextId;
}

export function getRefByTraceId(traceId) {
  const trace = traceCollection.getById(traceId);
  const calleeNode = trace && dataNodeCollection.getById(trace.nodeId);

  // lookup function data
  return calleeNode?.refId && valueCollection.getById(calleeNode.refId);
}

export function getFunctionRefByContext(context) {
  const functionTid = context?.definitionTid;
  return functionTid && getRefByTraceId(functionTid);
}

/**
 * Returns the ValueRef of the given bceTrace's `calleeTid`.
 */
export function getBCECalleeFunctionRef(bceTrace) {
  // lookup callee
  // const { calleeTid } = bceTrace?.data || EmptyObject;
  // const calleeTrace = calleeTid && traceCollection.getById(calleeTid);
  const calleeTrace = getRealCalleeTrace(bceTrace.traceId);
  const calleeNode = calleeTrace && dataNodeCollection.getById(calleeTrace.nodeId);

  // lookup function data
  return calleeNode?.refId && valueCollection.getById(calleeNode.refId);
}


/**
 * Returns the ValueRef of the called function of given bceTrace.
 * Unravels `call`, `apply`, `bind`.
 */
export function getRealBCECalleeFunctionRef(bceTrace) {
  // lookup callee
  // const { calleeTid } = bceTrace?.data || EmptyObject;
  if (!bceTrace.data?.calleeTid) {
    return null;
  }
  // BCE, but result was not recorded yet
  const calleeTrace = traceCollection.getById(bceTrace.data.calleeTid);
  const definitionTrace = calleeTrace && getFunctionDefinitionTraceOfTrace(calleeTrace);

  // lookup function data
  const calleeNode = definitionTrace && dataNodeCollection.getById(definitionTrace.nodeId);
  return calleeNode?.refId && valueCollection.getById(calleeNode.refId);
}

// /**
//  * WARNING: Only works when called from inside an instrumented function.
//  * NOTE: usually, we prefer `peekBCEMatchCallee`, since its safer.
//  * @returns {*} top bceTrace on stack, if its current function's callee's `staticContextId` matches that of the current context.
//  */
// export function peekBCECheckCallee() {
//   const bceTrace = traceCollection.getLast();
//   const calleeRef = bceTrace && getBCECalleeFunctionRef(bceTrace);
//   const functionRef = getLastFunctionRef();
//   return isSameFunction(calleeRef, functionRef) && bceTrace || null;
// }

export function peekBCEMatchCalleeUnchecked(func) {
  const bceTrace = traceCollection.getLast();
  return bceTrace;
}

/**
 * TODO: fix for `call`, `apply`, `bind`
 * 
 * @returns {*} top bceTrace on stack, if its callee is `func`
 */
export function peekBCEMatchCallee(func) {
  // console.trace('peekBCEMatchCallee', func);
  const bceTrace = traceCollection.getLast();
  const calleeRef = bceTrace && getBCECalleeFunctionRef(bceTrace);
  const functionRef = calleeRef && valueCollection.getRefByValue(func);
  // TODO: `functionRef` is referring to the original (because the original was traced)
  //    -> but `calleeRef` refers to the patched function instead
  return isSameFunction(calleeRef, functionRef) && bceTrace || null;
}

/**
 * @param {Trace} bceTrace
 * @param {[]} args
 */
export function getOrCreateRealArgumentDataNodeIds(bceTrace, args) {
  let {
    traceId: callId,
    data: { argTids }
  } = bceTrace;

  const callType = getSpecialCallType(callId);
  switch (callType) {
    case SpecialCallType.Call:
      argTids = argTids.slice(1);
      break;
    case SpecialCallType.Apply: {
      const argArrTraceId = argTids[1];
      const argArrNodeId = traceCollection.getOwnDataNodeIdByTraceId(argArrTraceId);

      // create new DataNodes: one per arg
      return args.map((arg, i) => {
        const varAccess = {
          objectNodeId: argArrNodeId,
          prop: i
        };
        const node = dataNodeCollection.createDataNode(
          arg, callId, DataNodeType.Read, varAccess
        );
        return node.nodeId;
      });
    }
    case SpecialCallType.Bind:
      // TODO: handle bind
      console.warn(`NYI: built-in HOF, called with bind (e.g. "arr.push.bind()") at "${traceCollection.makeTraceInfo(callId)}"`);
      argTids = EmptyArray;
      break;
    default:
      break;
  }
  return argTids.map(tid => traceCollection.getOwnDataNodeIdByTraceId(tid));
}


// ###########################################################################
// ExecutionContexts
// ###########################################################################


/**
 * Returns the trace that immediately followed the given `traceId`.
 * This can be used as a trick to get the first trace of a function call, if 
 * one knows the last trace before that function call.
 */
export function getFirstTraceAfter(traceId) {
  return traceCollection.getById(traceId + 1);
}

export function getFirstContextAfterTrace(traceId) {
  const trace = getFirstTraceAfter(traceId);
  return trace && executionContextCollection.getById(trace.contextId) || null;
}

/**
 * Gets the ref of (1) the callee and (2) the last real context, to make sure, they are the same.
 * This prevents returning the wrong context in case the actual context was not recorded.
 * 
 * @return {ExecutionContext} The context of the call of given `callId`, if it is the last executed context.
 */
export function peekBCEContextCheckCallee(callId, lastContextId) {
  const bceTrace = traceCollection.getById(callId);

  // 1. get ref of callee (e.g. `f` of `f(1)`)
  const calleeRef = bceTrace && getRealBCECalleeFunctionRef(bceTrace);

  // 2. get last executed real context
  // TODO: getLastRealContext is busted
  const context = executionContextCollection.getLastRealContext(lastContextId);
  const functionRef = getFunctionRefByContext(context);

  // 3. make sure the two are the same
  return isSameFunction(calleeRef, functionRef) && context || null;
}

/**
 * @returns The last opened context, if it is the execution of given `func`.
 */
export function getContextOfFunc(i, func) {
  const functionRef = valueCollection.getRefByValue(func);
  if (!functionRef) {
    return null;
  }
  const context = executionContextCollection.getByIndex(i + 1);
  const contextFunctionRef = context && getFunctionRefByContext(context);
  return isSameFunction(functionRef, contextFunctionRef) ? context : null;
}

export function isRootContext(contextId) {
  return !executionContextCollection.getById(contextId).parentContextId;
}

/** ###########################################################################
 * 
 * ##########################################################################*/

/**
 * NOTE: returns `null` if its first trace is not its own (e.g. if value was first recorded as a child value on another object)
 */
export function getFirstOwnTraceOfRefValue(value) {
  const ref = valueCollection.getRefByValue(value);
  if (!ref) { return null; }

  return getFirstOwnTraceOfRef(ref);
}

export function getFirstOwnTraceOfRef(ref) {
  const { nodeId } = ref;
  const firstDataNode = dataNodeCollection.getById(nodeId);
  if (!firstDataNode) { return null; }

  const { traceId, refId } = firstDataNode;
  const isOwn = refId === ref.refId;      // make sure its its own DataNode
  return isOwn && traceCollection.getById(traceId);
}

/**
 * NOTE: returns `null` if its first trace is not its own
 *    (e.g. if value was first recorded as a child value on another object)
 * @return {Trace}
 */
export function getFirstOwnTraceOfTrace(traceId) {
  const refId = getTraceRefId(traceId);
  const ref = valueCollection.getById(refId);
  if (!ref) { return null; }

  return getFirstOwnTraceOfRef(ref);
}

export function getTraceRefId(traceId) {
  const { nodeId } = traceCollection.getById(traceId);
  const dataNode = dataNodeCollection.getById(nodeId);
  if (!dataNode) { return null; }

  const { refId } = dataNode;
  return refId;
}

export function getTraceBCETrace() {

}

export function isTraceFunctionDefinitionTrace(trace) {
  const staticTrace = staticTraceCollection.getById(trace.staticTraceId);
  if (!staticTrace) { return false; }
  return isFunctionDefinitionTrace(staticTrace.type);
}

export function getFunctionDefinitionTraceOfValue(value) {
  if (!isFunction(value)) {
    return null;
  }

  let trace = getFirstOwnTraceOfRefValue(value);
  if (!trace) {
    return null;
  }
  return getFunctionDefinitionTraceOfTrace(trace);
}

/**
 * We assume `trace` to be a calleeTrace.
 * E.g. `f` in `f(1)` or `g(2)` in `g(2)(1)`
 * 
 * @param {Trace} trace A trace that potentially "owns" a function value.
 */
export function getFunctionDefinitionTraceOfTrace(trace) {
  if (trace.resultId) {
    // CER -> get BCE
    trace = traceCollection.getById(trace.resultId);
  }
  while (trace) {
    if (isTraceFunctionDefinitionTrace(trace)) {
      // function is instrumented
      return trace;
    }

    // if (trace.data?.calledFunctionTid) {
    //   // BCE of `call`, `apply` or `bind`
    //   trace = traceCollection.getById(trace.data.calledFunctionTid);
    // }
    // else 
    if (isCallResult(trace)) {
      // callee itself is a CallExpression, e.g. `g(2)(1)`
      const bceTrace = getBCETraceOfTrace(trace.traceId);
      if (bceTrace?.data?.calledFunctionTid) {
        // -> call, apply, or bind
        trace = traceCollection.getById(bceTrace.data.calledFunctionTid);
      }
    }

    const originalTrace = trace && getFirstOwnTraceOfTrace(trace.traceId);
    if (originalTrace === trace) {
      break;
    }
    trace = originalTrace;
  }
  return null;
}

/**
 * hackfix: there is no really reliable way of detecting whether something is a class.
 * But this works for es6 classes (if not babeled to es5).
 * 
 * @see https://stackoverflow.com/a/68708710/2228771
 */
function isClass(value) {
  return typeof value === 'function' && (
    /^\s*class[^\w]+/.test(Function.prototype.toString.call(value)) ||

    // 1. native classes don't have `class` in their name
    // 2. However, they are globals and start with a capital letter.
    (globalThis[value.name] === value && /^[A-Z]/.test(value.name))
  );
}

export function isInstrumentedFunction(value) {
  return isFunction(value) &&
    !!getFunctionDefinitionTraceOfValue(value);
}

// ###########################################################################
// traces
// ###########################################################################

export function getTraceStaticTrace(traceId) {
  const trace = traceCollection.getById(traceId);
  const { staticTraceId } = trace;
  return staticTraceCollection.getById(staticTraceId);
}

export function getTraceOwnDataNode(traceId) {
  const { nodeId } = traceCollection.getById(traceId);
  return dataNodeCollection.getById(nodeId);
}

// ###########################################################################
// DataNode
// ###########################################################################


// ###########################################################################
// copied from (requires synchronization with) DataProviderUtil
// future-work: move to new `dbux-common-data`
// ###########################################################################


/**
 * [sync]
 * Get callerTrace (BCE) of a call related trace, returns itself if it is not a call related trace.
 * Note: if a trace is both `CallArgument` and `CallExpressionResult`, returns the result trace.
 * @param {DataProvider} dp
 * @param {number} traceId
 * @return {Trace}
*/
export function getBCETraceOfTrace(traceId) {
  const traces = traceCollection;
  const trace = traces.getById(traceId);
  if (isCallResult(trace)) {
    // trace is call expression result
    return traces.getById(trace.resultCallId);
  }
  else if (hasCallId(trace)) {
    // trace is call/callback argument or BCE
    return traces.getById(trace.callId);
  }
  else {
    // not a call related trace
    return trace;
    // return null;
  }
}

/**
 * [sync]
 */
export function getSpecialCallType(callId) {
  const bceTrace = traceCollection.getById(callId);
  if (!bceTrace?.data) {
    return null;
  }

  switch (bceTrace.data.specialCallType) {
    case SpecialCallType.Call:
    case SpecialCallType.Apply:
    case SpecialCallType.Bind:
      return bceTrace.data.specialCallType;
  }

  return null;
}
/**
 * Accounts for `call`, `apply`, `bind`.
 * @param {DataProvider} dp
 */
export function getRealBCE(callId) {
  const bceTrace = traceCollection.getById(callId);
  if (!bceTrace?.data) {
    return null;
  }

  const callType = getSpecialCallType(callId);
  switch (callType) {
    case SpecialCallType.Call:
    case SpecialCallType.Apply:
      return bceTrace;
    case SpecialCallType.Bind:
    default: {
      // nothing to do here -> handle `Bound` case below
      break;
    }
  }

  // no match -> check for Bound
  const { calleeTid } = bceTrace.data;
  const bindTrace = getBindCallTrace(calleeTid);

  return bindTrace || bceTrace;
}



/**
 * Accounts for `call`, `apply`, `bind`.
 * @param {DataProvider} dp
 */
export function getRealCalleeTrace(callId) {
  const bceTrace = traceCollection.getById(callId);
  if (!bceTrace?.data) {
    return null;
  }

  let realCalleeTid;
  const callType = getSpecialCallType(callId);
  switch (callType) {
    case SpecialCallType.Call:
    case SpecialCallType.Apply:
      realCalleeTid = bceTrace.data.calledFunctionTid;
      break;
    case SpecialCallType.Bind:
    default: {
      // nothing to do here -> handle `Bound` case below
      break;
    }
  }

  // no match -> check for Bound
  const { calleeTid } = bceTrace.data;
  const bindTrace = getBindCallTrace(calleeTid);
  if (bindTrace?.data) {
    realCalleeTid = bindTrace.data.calledFunctionTid;
  }

  if (!realCalleeTid) {
    // default
    realCalleeTid = bceTrace.data.calleeTid;
  }
  else {
    // TODO: keep recursing in order to support arbitrary `bind` chains, e.g.: `f.bind.bind()`
  }

  return traceCollection.getById(realCalleeTid);
}

export function getBindCallTrace(functionTraceId) {
  if (!functionTraceId) {
    // callee was not recorded
    return null;
  }
  // const trace = dp.util.getTrace(functionTraceId);
  // if (!trace) {
  //   dp.logger.warn(`invalid functionTraceId does not have a trace:`, functionTraceId/* , dp.collections.traces._all */);
  //   return null;
  // }
  const originalTrace = getFirstOwnTraceOfTrace(functionTraceId);
  const bindTrace = originalTrace && getBCETraceOfTrace(originalTrace.traceId);
  if (bindTrace?.data?.specialCallType === SpecialCallType.Bind) {
    return bindTrace;
  }
  return null;
}

/** ###########################################################################
 * deal with "special" HOF arguments
 * ##########################################################################*/

export function getRealCallArgs(callId) {
  // TODO: see `dataProviderUtil.getCallArgDataNodes`
  // TODO: merge argTids and spreadArgs
  // return { argTids, spreadArgs };
}

/** ###########################################################################
 * async + promise stuff
 * ##########################################################################*/

export function getAsyncFunctionCallerPromiseId(realContextId) {
  const context = executionContextCollection.getById(realContextId);
  return context?.data?.callerPromiseId;
}

export function dataNode2String(dataNode) {
  let valString = '';
  if (dataNode.value !== null && dataNode.value !== undefined) {
    valString = dataNode.value.toString() + ' ';
  }
  if (dataNode.refId) {
    const ref = valueCollection.getById(dataNode.refId);
    const refString = `${ref.typeName}`;
    valString += `ref #${dataNode.refId} (${refString})`;
  }

  return `DataNode #${dataNode.nodeId} "${valString}"`;
}
