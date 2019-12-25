import Enum from 'dbux-common/src/util/Enum';

const ExecutionEventType = new Enum({
  ProgramStart: 1,
  StackStart: 2,
  StackEnd: 3,
  Enter: 4,
  Leave: 5,
  ScheduleCallback: 6,
  Interrupt: 7,
  Resume: 8
});

export default ExecutionEventType;