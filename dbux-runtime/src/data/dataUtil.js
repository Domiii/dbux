import dataNodeCollection from './dataNodeCollection';
import executionContextCollection from './executionContextCollection';
import staticTraceCollection from './staticTraceCollection';
import traceCollection from './traceCollection';
import valueCollection from './valueCollection';


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
  // lookup callee
  const { calleeTid } = bceTrace;
  const calleeTrace = calleeTid && traceCollection.getById(calleeTid);
  const calleeNode = calleeTrace && dataNodeCollection.getById(calleeTrace.nodeId);
  
  // lookup function data
  const functionRef = calleeNode?.refId && valueCollection.getById(calleeNode.refId);
  return getFunctionStaticContextId(functionRef);
}

/**
 * WARNING: Does not work with monkey-patched runtime functions.
 * @returns {*} top bceTrace on stack, if it's callee's `staticContextId` matches that of the stack top.
 */
export function peekBCECheckCallee() {
  const bceTrace = traceCollection.getLast();
  const calleeStaticContextId = bceTrace && getBCECalleeStaticContextId(bceTrace);

  const context = executionContextCollection.getLast();
  const currentStaticContextId = context?.staticContextId;
  if (currentStaticContextId && currentStaticContextId === calleeStaticContextId) {
    return bceTrace;
  }
  return null;
}

/**
 * @returns {*} top bceTrace on stack, if it's callee's `staticContextId` matches that of the stack top.
 */
export function peekBCEMatchCallee(func) {
  const bceTrace = traceCollection.getLast();
  const calleeStaticContextId = bceTrace && getBCECalleeStaticContextId(bceTrace);

  const functionRef = valueCollection.getRefByValue(func);
  const functionStaticContextId = functionRef && getFunctionStaticContextId(functionRef);
  if (functionStaticContextId && functionStaticContextId === calleeStaticContextId) {
    return bceTrace;
  }
  return null;
}