import Enum from 'dbux-common/src/util/Enum';

let TraceDetailsNodeType = {
  StaticTrace: 1,
  Trace: 2,
  ExecutionContext: 3,
  StaticContext: 3,
  TraceDetail: 4
}; TraceDetailsNodeType = new Enum(TraceDetailsNodeType);

export default TraceDetailsNodeType;