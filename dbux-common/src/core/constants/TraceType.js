import Enum from '../../util/Enum';

/**
 * 
 */
let TraceType = {
  PushImmediate: 2,
  PopImmediate: 3,

  BeforeExpression: 4,
  BeforeCallExpression: 5,
  /**
   * E.g. `a.b.c` for `a.b.c.f()` method call.
   * Not traced for `f()` (no object involved).
   */
  CalleeObject: 6,
  CallExpressionResult: 7,
  ExpressionResult: 8,
  ExpressionValue: 9,

  CallArgument: 10,
  CallbackArgument: 11,

  PushCallback: 12,
  PopCallback: 13,

  Await: 14,
  Resume: 15,

  Statement: 16,
  BlockStart: 17,
  BlockEnd: 18
};

TraceType = new Enum(TraceType);

const pushTypes = new Array(TraceType.getCount()).map(_ => false);
pushTypes[TraceType.PushImmediate] = true;
pushTypes[TraceType.PushCallback] = true;
pushTypes[TraceType.Resume] = true;

export function isTracePush(traceType) {
  return pushTypes[traceType];
}


const popTypes = new Array(TraceType.getCount()).map(_ => false);
popTypes[TraceType.PopImmediate] = true;
popTypes[TraceType.PopCallback] = true;

export function isTracePop(traceType) {
  return popTypes[traceType];
}


const dynamicTypeTypes = new Array(TraceType.getCount()).map(_ => false);
// shared w/ PushCallback + PopCallback
dynamicTypeTypes[TraceType.CallbackArgument] = true;  
// might be shared w/ CallbackArgument, PushCallback + PopCallback
dynamicTypeTypes[TraceType.CallArgument] = true;

export function hasDynamicTypes(traceType) {
  return dynamicTypeTypes[traceType];
}


const valueTypes = new Array(TraceType.getCount()).map(_ => false);
valueTypes[TraceType.ExpressionResult] = true;
valueTypes[TraceType.CallArgument] = true;
valueTypes[TraceType.CallbackArgument] = true;
valueTypes[TraceType.CallExpressionResult] = true;
valueTypes[TraceType.PopCallback] = true;

export function hasTraceValue(traceType) {
  return valueTypes[traceType];
}


const expressionTypes = new Array(TraceType.getCount()).map(_ => false);
expressionTypes[TraceType.ExpressionResult] = true;
expressionTypes[TraceType.CallArgument] = true;
expressionTypes[TraceType.CallbackArgument] = true;
expressionTypes[TraceType.CallExpressionResult] = true;

export function isTraceExpression(traceType) {
  return expressionTypes[traceType];
}


const callbackTypes = new Array(TraceType.getCount()).map(_ => false);
callbackTypes[TraceType.CallbackArgument] = true;
callbackTypes[TraceType.PushCallback] = true;
callbackTypes[TraceType.PopCallback] = true;

export function isCallbackRelatedTrace(traceType) {
  return callbackTypes[traceType];
}


const dataTraceTypes = new Array(TraceType.getCount()).map(_ => false);
dataTraceTypes[TraceType.CallArgument] = true;
dataTraceTypes[TraceType.ExpressionValue] = true;
export function isDataTraceType(traceType) {
  return dataTraceTypes[traceType];
}

export default TraceType;