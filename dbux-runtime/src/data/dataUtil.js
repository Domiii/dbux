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

export function getBCECalleeStaticContextId(bceTrace) {
  const functionRef = getBCECalleeFunctionRef(bceTrace);
  return functionRef && getFunctionStaticContextId(functionRef);
}

export function getBCECalleeFunctionRef(bceTrace) {
  // lookup callee
  const { calleeTid } = bceTrace?.data || EmptyObject;
  const calleeTrace = calleeTid && traceCollection.getById(calleeTid);
  const calleeNode = calleeTrace && dataNodeCollection.getById(calleeTrace.nodeId);

  // lookup function data
  return calleeNode?.refId && valueCollection.getById(calleeNode.refId);
}

/**
 * WARNING: Does not work with monkey-patched runtime functions.
 * @returns {*} top bceTrace on stack, if its current function's callee's `staticContextId` matches that of the stack top.
 */
export function peekBCECheckCallee() {
  const bceTrace = traceCollection.getLast();
  const calleeStaticContextId = bceTrace && getBCECalleeStaticContextId(bceTrace);

  const context = executionContextCollection.getLastRealContext();
  const currentStaticContextId = context?.staticContextId;
  if (currentStaticContextId && currentStaticContextId === calleeStaticContextId) {
    return bceTrace;
  }
  return null;
}

export function getBCEContext(callId) {
  const bceTrace = traceCollection.getById(callId);
  const calleeStaticContextId = bceTrace && getBCECalleeStaticContextId(bceTrace);

  const context = executionContextCollection.getLastRealContext();
  const currentStaticContextId = context?.staticContextId;
  if (currentStaticContextId && currentStaticContextId === calleeStaticContextId) {
    return context;
  }
  return null;
}

/// OLD:* @returns {*} top bceTrace on stack, if its callee's `staticContextId` matches that of the stack top.
/**
 * @returns {*} top bceTrace on stack, if its callee is `func`
 */
export function peekBCEMatchCallee(func) {
  const bceTrace = traceCollection.getLast();
  const calleeRef = bceTrace && getBCECalleeFunctionRef(bceTrace);
  const functionRef = calleeRef && valueCollection.getRefByValue(func);
  return calleeRef && calleeRef === functionRef && bceTrace || null;
  // const functionStaticContextId = functionRef && getFunctionStaticContextId(functionRef);
  // if (functionStaticContextId && functionStaticContextId === calleeStaticContextId) {
  //   return bceTrace;
  // }
  // return null;
}

// ###########################################################################
// ExecutionContexts
// ###########################################################################

export function isFirstContextInParent(contextId) {
  return executionContextCollection.isFirstContextInParent(contextId);
}

export function isRootContext(contextId) {
  return !executionContextCollection.getById(contextId).parentContextId;
}