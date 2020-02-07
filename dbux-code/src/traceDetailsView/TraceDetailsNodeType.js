import Enum from 'dbux-common/src/util/Enum';

let TraceDetailsNodeType = {
  StaticTrace: 1,
  Trace: 2,
  TraceDetail: 3,
  StaticContext: 4,
  ExecutionContext: 5
}; TraceDetailsNodeType = new Enum(TraceDetailsNodeType);

export default TraceDetailsNodeType;