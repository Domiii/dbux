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

  Await: 7,
  Resume: 8,

  BeforeExpression: 9,
  ExpressionResult: 10,
  Statement: 11,
  BlockStart: 12,
  BlockEnd: 13
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
dynamicTypeTypes[TraceType.ScheduleCallback] = true;

export function isTracePush(traceType) {
  return pushTypes[traceType];
}

export function isTracePop(traceType) {
  return popTypes[traceType];
}

export function hasDynamicTypes(traceType) {
  return dynamicTypeTypes[traceType];
}

export default TraceType;