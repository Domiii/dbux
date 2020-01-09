import Enum from '../../util/Enum';

const ExecutionContextType = new Enum({
  Immediate: 1,
  ScheduleCallback: 2,
  ExecuteCallback: 3,
  Interrupt: 4,
  Resume: 5
});

export default ExecutionContextType;