import Enum from 'dbux-common/src/util/Enum';

let TraceDetailsNodeType = {
  StaticTrace: 1,
  Trace: 2,
  StaticContext: 3,
  ExecutionContext: 4,

  TypeTraceDetail: 5,
  PreviousContextTraceDetail: 6,
  NextContextTraceDetail: 7,
  ValueTraceDetail: 8

}; TraceDetailsNodeType = new Enum(TraceDetailsNodeType);

export default TraceDetailsNodeType;