import BitMaskEnum from '../../util/BitMaskEnum';

const TraceTypeSet = {
  PushImmediate: 1,
  PopImmediate: 1,

  BeforeExpression: 1,
  BeforeCallExpression: 1,
  /**
   * E.g. `a.b.c` for `a.b.c.f()` method call.
   * Not traced for `f()` (no object involved).
   */
  CalleeObject: 1,
  CallExpressionResult: 1,
  ExpressionResult: 1,
  ExpressionValue: 1,

  CallArgument: 1,
  CallbackArgument: 1,

  PushCallback: 1,
  PopCallback: 1,

  Await: 1,
  Resume: 1,

  Statement: 1,
  BlockStart: 1,
  BlockEnd: 1,

  ReturnArgument: 1,
  ReturnNoArgument: 1,

  ThrowArgument: 1,

  EndOfContext: 1
};

/**
 * @type {(BitMaskEnum|TraceTypeSet)}
 */
const TraceType = new BitMaskEnum(Object.values(TraceTypeSet));

const pushTypes = 
  TraceType.PushImmediate |
  TraceType.PushCallback |
  TraceType.Resume;

export function isTracePush(traceType) {
  return !!(pushTypes & traceType);
}


const popTypes =
  TraceType.PopImmediate |
  TraceType.PopCallback;

export function isTracePop(traceType) {
  return !!(popTypes & traceType);
}


const functionExitTypes =
  TraceType.ReturnArgument |
  TraceType.ReturnNoArgument |
  TraceType.EndOfContext; 
  
export function isTraceFunctionExit(traceType) {
  return !!(functionExitTypes & traceType);
}


const dynamicTypeTypes =
  // shared w/ PushCallback + PopCallback
  TraceType.CallbackArgument |  
  // might be shared w/ CallbackArgument, PushCallback + PopCallback
  TraceType.CallArgument;

export function hasDynamicTypes(traceType) {
  return !!(dynamicTypeTypes & traceType);
}


const expressionTypes =
  TraceType.ExpressionResult |
  TraceType.ExpressionValue |
  TraceType.CallArgument |
  TraceType.CallbackArgument |
  TraceType.CallExpressionResult |
  TraceType.ReturnArgument |
  TraceType.ThrowArgument;

export function isTraceExpression(traceType) {
  return !!(expressionTypes & traceType);
}

const valueTypes = expressionTypes |
  TraceType.PopCallback; // has return value of function

export function hasTraceValue(traceType) {
  return !!(valueTypes & traceType);
}


const callbackTypes =
  TraceType.CallbackArgument |
  TraceType.PushCallback |
  TraceType.PopCallback;

export function isCallbackRelatedTrace(traceType) {
  return !!(callbackTypes & traceType);
}


const dataOnlyTypes =
// dataTraceTypes[TraceType.CallArgument] = true;
  TraceType.ExpressionValue;

/**
 * Traces that are important for data flow analysis, but not important for control flow analysis
 */
export function isDataTrace(traceType) {
  return !!(dataOnlyTypes & traceType);
}


const returnTypes =
  TraceType.ReturnArgument |
  TraceType.ReturnNoArgument;

export function isReturnTrace(traceType) {
  return !!(returnTypes & traceType);
}

export function isBeforeCallExpression(traceType) {
  return TraceType.is.BeforeCallExpression(traceType);
}

export function isTraceThrow(traceType) {
  // TraceType.ThrowArgument;
}

export default TraceType;