import Enum from '../../util/Enum';

let TraceType = {
  PushImmediate: 1,
  PopImmediate: 1,

  BeforeExpression: 1,
  BeforeCallExpression: 1,
  /**
   * E.g. `a.b.c` for `a.b.c.f()` method call.
   * Not traced for `f()` (no object involved).
   */
  CalleeObject: 1,
  CallExpressionResult: 1,
  ExpressionResult: 1,
  ExpressionValue: 1,

  CallArgument: 1,
  CallbackArgument: 1,

  PushCallback: 1,
  PopCallback: 1,

  Statement: 1,
  BlockStart: 1,
  BlockEnd: 1,

  // Return
  ReturnArgument: 1,
  ReturnNoArgument: 1,

  // Throw
  ThrowArgument: 1,
  ThrowCallExpession: 1,

  // Await
  Await: 1,
  Resume: 1,
  

  // AwaitCallExpression: 1,
  // ReturnAwait: 1,
  // ReturnAwaitCallExpression: 1,

  EndOfContext: 1
};

/**
 * @type {(Enum|TraceTypeSet)}
 */
TraceType = new Enum(Object.keys(TraceType));

const pushTypes = new Array(TraceType.getCount()).map(() => false);
pushTypes[TraceType.PushImmediate] = true;
pushTypes[TraceType.PushCallback] = true;
pushTypes[TraceType.Resume] = true;

export function isTracePush(traceType) {
  return pushTypes[traceType];
}


const popTypes = new Array(TraceType.getCount()).map(() => false);
popTypes[TraceType.PopImmediate] = true;
popTypes[TraceType.PopCallback] = true;

export function isTracePop(traceType) {
  return popTypes[traceType];
}


const returnTraceTypes = new Array(TraceType.getCount()).map(() => false);
returnTraceTypes[TraceType.ReturnArgument] = true;
returnTraceTypes[TraceType.ReturnNoArgument] = true;

export function isTraceReturn(traceType) {
  return returnTraceTypes[traceType];
}


const functionExitTypes = [...returnTraceTypes];
functionExitTypes[TraceType.EndOfContext] = true;

export function isTraceFunctionExit(traceType) {
  return functionExitTypes[traceType];
}


const dynamicTypeTypes = new Array(TraceType.getCount()).map(() => false);
// shared w/ PushCallback + PopCallback
dynamicTypeTypes[TraceType.CallbackArgument] = true;  
// might be shared w/ CallbackArgument, PushCallback + PopCallback
dynamicTypeTypes[TraceType.CallArgument] = true;

export function hasDynamicTypes(traceType) {
  return dynamicTypeTypes[traceType];
}


const expressionTypes = new Array(TraceType.getCount()).map(() => false);
expressionTypes[TraceType.ExpressionResult] = true;
expressionTypes[TraceType.ExpressionValue] = true;
expressionTypes[TraceType.CallArgument] = true;
expressionTypes[TraceType.CallbackArgument] = true;
expressionTypes[TraceType.CallExpressionResult] = true;
expressionTypes[TraceType.ReturnArgument] = true;
expressionTypes[TraceType.ThrowArgument] = true;

export function isTraceExpression(traceType) {
  return expressionTypes[traceType];
}

const valueTypes = [...expressionTypes];
valueTypes[TraceType.PopCallback] = true; // has return value of function

export function hasTraceValue(traceType) {
  return valueTypes[traceType];
}


const callbackTypes = new Array(TraceType.getCount()).map(() => false);
callbackTypes[TraceType.CallbackArgument] = true;
callbackTypes[TraceType.PushCallback] = true;
callbackTypes[TraceType.PopCallback] = true;

export function isCallbackRelatedTrace(traceType) {
  return callbackTypes[traceType];
}


const dataOnlyTypes = new Array(TraceType.getCount()).map(() => false);
// dataTraceTypes[TraceType.CallArgument] = true;
dataOnlyTypes[TraceType.ExpressionValue] = true;
/**
 * Traces that are important for data flow analysis, but not important for control flow analysis
 */
export function isDataTrace(traceType) {
  return dataOnlyTypes[traceType];
}

export function isBeforeCallExpression(traceType) {
  return TraceType.is.BeforeCallExpression(traceType);
}

export function isTraceThrow(traceType) {
  TraceType.is.ThrowArgument(traceType);
}

export default TraceType;