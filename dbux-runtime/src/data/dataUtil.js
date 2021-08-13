import { isFunctionDefinitionTrace } from '@dbux/common/src/types/constants/TraceType';
import { hasCallId, isCallResult } from '@dbux/common/src/types/constants/traceCategorization';
import ExecutionContext from '@dbux/common/src/types/ExecutionContext';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { isFunction } from 'lodash';
import dataNodeCollection from './dataNodeCollection';
import executionContextCollection from './executionContextCollection';
import staticTraceCollection from './staticTraceCollection';
import traceCollection from './traceCollection';
import valueCollection from './valueCollection';
import SpecialCallType from '@dbux/common/src/types/constants/SpecialCallType';


// ###########################################################################
// BCE + callees
// ###########################################################################


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

/**
 * @return {ValueRef} ValueRef of the function whose context last executed.
 */
export function getLastFunctionRef() {
  const context = executionContextCollection.getLastRealContext();
  return context && getFunctionRefByContext(context);
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
  const { calleeTid } = bceTrace?.data || EmptyObject;
  const calleeTrace = calleeTid && traceCollection.getById(calleeTid);
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
//   return calleeRef && calleeRef === functionRef && bceTrace || null;
// }

/**
 * TODO: fix for `call`, `apply`, `bind`
 * 
 * @returns {*} top bceTrace on stack, if its callee is `func`
 */
export function peekBCEMatchCallee(func) {
  const bceTrace = traceCollection.getLast();
  const calleeRef = bceTrace && getBCECalleeFunctionRef(bceTrace);
  const functionRef = calleeRef && valueCollection.getRefByValue(func);
  // TODO: `functionRef` is referring to the original (because the original was traced)
  //    -> but `calleeRef` refers to the patched function instead
  return calleeRef && calleeRef === functionRef && bceTrace || null;
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
 * @return {ExecutionContext} The context of the call of given `callId`, if it is the last executed context.
 */
export function peekBCEContextCheckCallee(callId) {
  const bceTrace = traceCollection.getById(callId);
  const calleeRef = bceTrace && getRealBCECalleeFunctionRef(bceTrace);

  const context = executionContextCollection.getLastRealContext();
  const contextFunctionRef = getFunctionRefByContext(context);
  return calleeRef && calleeRef === contextFunctionRef && context || null;
}

/**
 * @returns The last opened context, if it is the execution of given `func`.
 */
export function peekContextCheckCallee(func) {
  const functionRef = valueCollection.getRefByValue(func);
  if (!functionRef) {
    return null;
  }
  const context = executionContextCollection.getLastRealContext();
  const contextFunctionRef = context && getFunctionRefByContext(context);
  return functionRef === contextFunctionRef ? context : null;
}


export function isFirstContextInParent(contextId) {
  return executionContextCollection.isFirstContextInParent(contextId);
}

export function isRootContext(contextId) {
  return !executionContextCollection.getById(contextId).parentContextId;
}

// ###########################################################################
//
// ###########################################################################

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
 */
export function getFirstOwnTraceOfTraceValue(traceId) {
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
  return getFunctionDefinitionTraceOfTrace(trace);
}

/**
 * @param {Trace} trace A trace that potentially "owns" a function value.
 */
export function getFunctionDefinitionTraceOfTrace(trace) {
  if (trace.resultId) {
    // CRE -> get BCE
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
    if (!isCallResult(trace)) {
      return null;
    }

    // -> check for bind call
    const bceTrace = getBCETraceOfTrace(trace.traceId);
    if (!bceTrace?.data?.calledFunctionTid) {
      return null;
    }
    trace = traceCollection.getById(bceTrace.data.calledFunctionTid);

    trace = trace && getFirstOwnTraceOfTraceValue(trace.traceId);
  }
  return null;
}

export function isInstrumentedFunction(value) {
  return !!getFunctionDefinitionTraceOfValue(value);
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
