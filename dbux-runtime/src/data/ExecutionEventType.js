import Enum from 'dbux-common/src/util/Enum';

const ExecutionEventType = new Enum({
  ProgramStart: 1,

  PushImmediate: 2,
  PopImmediate: 3,
  
  ScheduleCallback: 4,
  PushCallback: 5,
  PopCallback: 6,

  Interrupt: 7,
  Resume: 8
});

const pushEvents = new Array(ExecutionEventType.getCount()).map(_ => false);
pushEvents[ExecutionEventType.PushImmediate] = true;
pushEvents[ExecutionEventType.PushCallback] = true;

const popEvents = new Array(ExecutionEventType.getCount()).map(_ => false);
popEvents[ExecutionEventType.PopImmediate] = true;
popEvents[ExecutionEventType.PopCallback] = true;

export function isPushEvent(eventType) {
  return pushEvents[eventType];
}

export function isPopEvent(eventType) {
  return popEvents[eventType];
}

export default ExecutionEventType;