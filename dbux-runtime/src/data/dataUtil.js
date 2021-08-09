import { isFunctionDefinitionTrace } from '@dbux/common/src/types/constants/TraceType';
import ExecutionContext from '@dbux/common/src/types/ExecutionContext';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import dataNodeCollection from './dataNodeCollection';
import executionContextCollection from './executionContextCollection';
import staticTraceCollection from './staticTraceCollection';
import traceCollection from './traceCollection';
import valueCollection from './valueCollection';


// ###########################################################################
// BCE + callees
// ###########################################################################

/**
 * Looks up the latest BCE on the stack.
 * Returns the `staticContextId` of `BCE` -> `callee` -> `FunctionDefinition`.
 */
export function getCurrentCalleeStaticContextId() {
  const bceTrace = traceCollection.getLast();
  return bceTrace && getBCECalleeStaticContextId(bceTrace);
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

export function getBCECalleeFunctionRef(bceTrace) {
  // lookup callee
  const { calleeTid } = bceTrace?.data || EmptyObject;
  const calleeTrace = calleeTid && traceCollection.getById(calleeTid);
  const calleeNode = calleeTrace && dataNodeCollection.getById(calleeTrace.nodeId);

  // lookup function data
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
 * @returns {*} top bceTrace on stack, if its callee is `func`
 */
export function peekBCEMatchCallee(func) {
  const bceTrace = traceCollection.getLast();
  const calleeRef = bceTrace && getBCECalleeFunctionRef(bceTrace);
  const functionRef = calleeRef && valueCollection.getRefByValue(func);
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


export function getBCECalleeStaticContextId(bceTrace) {
  const functionRef = getBCECalleeFunctionRef(bceTrace);
  return functionRef && getFunctionStaticContextId(functionRef);
}

/**
 * @return {ExecutionContext} The context of the call of given `callId`, if it is the last executed context.
 */
export function peekBCEContextCheckCallee(callId) {
  const bceTrace = traceCollection.getById(callId);
  const calleeRef = bceTrace && getBCECalleeFunctionRef(bceTrace);

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

  const { nodeId } = ref;
  const dataNode = dataNodeCollection.getById(nodeId);
  if (!dataNode) { return null; }

  const { traceId, refId } = dataNode;
  const isOwn = refId === ref.refId;      // make sure its its own trace
  return isOwn && traceCollection.getById(traceId);
}

export function isInstrumentedFunction(value) {
  // if (!isFunction(value)) {
  //   // NOTE: the trace below might actually be the function definition trace, if the value is the prototype, or something else that was recorded during that trace.
  //   return false;
  // }

  const trace = getFirstOwnTraceOfRefValue(value);
  if (!trace) { return false; }
  const staticTrace = staticTraceCollection.getById(trace.staticTraceId);
  if (!staticTrace) { return false; }

  return isFunctionDefinitionTrace(staticTrace.type);
}