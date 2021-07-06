import Enum from '@dbux/common/src/util/Enum';

const TraceInstrumentationType = new Enum({
  NoTrace: 0,
  // Callee: 1,
  CallExpression: 2,
  /**
   * Result of a computation
   */
  ExpressionResult: 3,
  /**
   * Only keeping track of data
   */
  ExpressionValue: 4,
  // ExpressionNoValue: 3,
  Statement: 5,
  Block: 6,
  Loop: 7,

  // Special attention required for these
  MemberProperty: 8,
  MemberObject: 9,
  Super: 10,
  ReturnArgument: 11,
  ReturnNoArgument: 12,
  ThrowArgument: 13,

  Function: 14,
  Await: 15
});
export default TraceInstrumentationType;