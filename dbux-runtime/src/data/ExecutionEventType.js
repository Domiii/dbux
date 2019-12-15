import Enum from 'dbux-common/dist/util/Enum';

const ExecutionEventType = new Enum({
  ProgramStart: 1,
  Push: 2,
  Pop: 3,
  StackStart: 4,
  StackEnd: 5,
  Schedule: 6
});

export default ExecutionEventType;