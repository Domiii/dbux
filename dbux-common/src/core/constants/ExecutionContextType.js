import Enum from '../../util/Enum';


let ExecutionContextType = {
  Immediate: 1,
  ScheduleCallback: 2,
  ExecuteCallback: 3,
  Interrupt: 4,
  Resume: 5
};

// NOTE: we cannot use `const` in a single assignment here, because that way, type members would not be recognized.
ExecutionContextType = new Enum(ExecutionContextType);

export default ExecutionContextType;