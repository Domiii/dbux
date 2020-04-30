import Enum from 'dbux-common/src/util/Enum';

let TraceMode = {
  ContextOnly: 1,
  // AllTraces: 2,
  ParentTraces: 2
};

TraceMode = new Enum(TraceMode);

export default TraceMode;