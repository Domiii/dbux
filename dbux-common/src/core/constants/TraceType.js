import Enum from '../../util/Enum';

/**
 * 
 */
const TraceType = new Enum({
  StartProgram: 1,

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
  BlockStart: 12
});

const pushTypes = new Array(TraceType.getCount()).map(_ => false);
pushTypes[TraceType.PushImmediate] = true;
pushTypes[TraceType.PushCallback] = true;

const popTypes = new Array(TraceType.getCount()).map(_ => false);
popTypes[TraceType.PopImmediate] = true;
popTypes[TraceType.PopCallback] = true;

export function isTracePush(traceType) {
  return pushTypes[traceType];
}

export function isTracePop(traceType) {
  return popTypes[traceType];
}

export default TraceType;