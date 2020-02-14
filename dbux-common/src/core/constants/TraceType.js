import Enum from '../../util/Enum';

/**
 * 
 */
let TraceType = {
  PushImmediate: 2,
  PopImmediate: 3,

  BeforeExpression: 4,
  Callee: 5,
  ExpressionResult: 6,

  CallArgument: 7,
  CallbackArgument: 8,

  PushCallback: 9,
  PopCallback: 10,

  Await: 11,
  Resume: 12,

  Statement: 13,
  BlockStart: 14,
  BlockEnd: 15
};

TraceType = new Enum(TraceType);

const pushTypes = new Array(TraceType.getCount()).map(_ => false);
pushTypes[TraceType.StartProgram] = true;
pushTypes[TraceType.PushImmediate] = true;
pushTypes[TraceType.PushCallback] = true;
pushTypes[TraceType.Resume] = true;


const popTypes = new Array(TraceType.getCount()).map(_ => false);
popTypes[TraceType.PopImmediate] = true;
popTypes[TraceType.PopCallback] = true;


const dynamicTypeTypes = new Array(TraceType.getCount()).map(_ => false);

// shared w/ PushCallback + PopCallback
dynamicTypeTypes[TraceType.CallbackArgument] = true;  
// might be shared w/ CallbackArgument, PushCallback + PopCallback
dynamicTypeTypes[TraceType.CallArgument] = true;


const valueTypes = new Array(TraceType.getCount()).map(_ => false);
valueTypes[TraceType.ExpressionResult] = true;
valueTypes[TraceType.CallArgument] = true;

export function isTracePush(traceType) {
  return pushTypes[traceType];
}

export function isTracePop(traceType) {
  return popTypes[traceType];
}

export function hasDynamicTypes(traceType) {
  return dynamicTypeTypes[traceType];
}

export function hasValue(traceType) {
  return valueTypes[traceType];
}

export default TraceType;