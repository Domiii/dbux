import Enum from 'dbux-common/dist/util/Enum';

const ExecutionEventType = new Enum({
  ProgramStart: 1,
  StackStart: 2,
  StackEnd: 3,
  PushImmediate: 4,
  PopImmediate: 5,
  ScheduleCallback: 6,
  Interrupt: 7,
  Resume: 8
});

export default ExecutionEventType;