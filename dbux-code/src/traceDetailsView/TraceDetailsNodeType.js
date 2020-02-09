import Enum from 'dbux-common/src/util/Enum';

let TraceDetailsNodeType = {
  StaticTrace: 1,
  Trace: 2,
  StaticContext: 3,
  ExecutionContext: 4,

  PreviousContextTraceDetail: 5,
  NextContextTraceDetail: 6,

}; TraceDetailsNodeType = new Enum(TraceDetailsNodeType);

export default TraceDetailsNodeType;