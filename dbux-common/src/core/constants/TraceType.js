import Enum from '../../util/Enum';

/**
 * 
 */
let TraceType = {
  PushImmediate: 2,
  PopImmediate: 3,

  BeforeExpression: 4,
  Callee: 5,
  CallExpression: 6,
  ExpressionResult: 7,

  CallArgument: 8,
  CallbackArgument: 9,

  PushCallback: 10,
  PopCallback: 11,

  Await: 12,
  Resume: 13,

  Statement: 14,
  BlockStart: 15,
  BlockEnd: 16
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