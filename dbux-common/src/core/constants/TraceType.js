import Enum from '../../util/Enum';

/**
 * 
 */
let TraceType = {
  PushImmediate: 2,
  PopImmediate: 3,

  ScheduleCallback: 4,
  PushCallback: 5,
  PopCallback: 6,

  BeforeExpression: 7,

  ExpressionResult: 8,
  CallArgument: 9,

  Await: 10,
  Resume: 11,

  Statement: 12,
  BlockStart: 13,
  BlockEnd: 14
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
dynamicTypeTypes[TraceType.ScheduleCallback] = true;  
// might be shared w/ ScheduleCallback, PushCallback + PopCallback
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