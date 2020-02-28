import Enum from '../../util/Enum';

/**
 * 
 */
let TraceType = {
  PushImmediate: 2,
  PopImmediate: 3,

  BeforeExpression: 4,
  BeforeCallExpression: 5,
  Callee: 6,
  CallExpressionResult: 7,
  ExpressionResult: 8,

  CallArgument: 9,
  CallbackArgument: 10,

  PushCallback: 11,
  PopCallback: 12,

  Await: 13,
  Resume: 14,

  Statement: 15,
  BlockStart: 16,
  BlockEnd: 17
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

export function hasTraceTypeValue(traceType) {
  return valueTypes[traceType];
}

export default TraceType;