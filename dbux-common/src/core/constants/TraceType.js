import Enum from '../../util/Enum';

const TraceType = new Enum({
  ProgramStart: 1,

  PushImmediate: 2,
  PopImmediate: 3,

  ScheduleCallback: 4,
  PushCallback: 5,
  PopCallback: 6,

  Await: 7,
  Resume: 8,

  // Assignment: 9,
  BeforeExpression: 10,
  ExpressionResult: 11,
  Statement: 12,
  BlockStart: 13
});

const pushEvents = new Array(TraceType.getCount()).map(_ => false);
pushEvents[TraceType.PushImmediate] = true;
pushEvents[TraceType.PushCallback] = true;

const popEvents = new Array(TraceType.getCount()).map(_ => false);
popEvents[TraceType.PopImmediate] = true;
popEvents[TraceType.PopCallback] = true;

export function isTracePush(traceType) {
  return pushEvents[traceType];
}

export function isPopEvent(traceType) {
  return popEvents[traceType];
}

export default TraceType;