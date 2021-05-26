import Enum from '../../util/Enum';

// eslint-disable-next-line import/no-mutable-exports
let TraceType = {
  PushImmediate: 1,
  PopImmediate: 2,

  BeforeExpression: 3,
  /**
   * NOTE: `BeforeCallExpression` has now become `Callee`, meaning it also holds a value
   */
  BeforeCallExpression: 4,
  // /**
  //  * E.g. `a.b.c` for `a.b.c.f()` method call.
  //  * Not traced for `f()` (no object involved).
  //  */
  CallExpressionResult: 6,
  ExpressionResult: 7,
  ExpressionValue: 8,
  
  Declaration: 11,
  WriteVar: 12,
  Identifier: 13,
  Literal: 14,
  CallArgument: 15,

  PushCallback: 11,
  PopCallback: 12,

  Statement: 13,
  BlockStart: 14,
  BlockEnd: 15,

  // Return
  ReturnArgument: 16,
  ReturnNoArgument: 17,

  // Throw
  ThrowArgument: 18,
  ThrowCallExpession: 19,

  // Await
  Await: 20,
  Resume: 21,
  

  // AwaitCallExpression: 1,
  // ReturnAwait: 1,
  // ReturnAwaitCallExpression: 1,

  EndOfContext: 22
};

/**
 * @type {(Enum|TraceTypeSet)}
 */
TraceType = new Enum(TraceType);

const pushTypes = new Array(TraceType.getValueMaxIndex()).map(() => false);
pushTypes[TraceType.PushImmediate] = true;
pushTypes[TraceType.PushCallback] = true;
pushTypes[TraceType.Resume] = true;

export function isTracePush(traceType) {
  return pushTypes[traceType];
}


const popTypes = new Array(TraceType.getValueMaxIndex()).map(() => false);
popTypes[TraceType.PopImmediate] = true;
popTypes[TraceType.PopCallback] = true;

export function isTracePop(traceType) {
  return popTypes[traceType];
}


const returnTraceTypes = new Array(TraceType.getValueMaxIndex()).map(() => false);
returnTraceTypes[TraceType.ReturnArgument] = true;
returnTraceTypes[TraceType.ReturnNoArgument] = true;

export function isTraceReturn(traceType) {
  return returnTraceTypes[traceType];
}


const functionExitTypes = [...returnTraceTypes];
functionExitTypes[TraceType.EndOfContext] = true;

export function isTraceFunctionExit(traceType) {
  return functionExitTypes[traceType];
}


const dynamicTypeTypes = new Array(TraceType.getValueMaxIndex()).map(() => false);
// shared w/ PushCallback + PopCallback
dynamicTypeTypes[TraceType.CallbackArgument] = true;  
// might be shared w/ CallbackArgument, PushCallback + PopCallback
dynamicTypeTypes[TraceType.CallArgument] = true;

export function hasDynamicTypes(traceType) {
  return dynamicTypeTypes[traceType];
}


const expressionTypes = new Array(TraceType.getValueMaxIndex()).map(() => false);
expressionTypes[TraceType.BeforeCallExpression] = true;
expressionTypes[TraceType.ExpressionResult] = true;
expressionTypes[TraceType.ExpressionValue] = true;
expressionTypes[TraceType.CallArgument] = true;
expressionTypes[TraceType.CallbackArgument] = true;
expressionTypes[TraceType.CallExpressionResult] = true;
expressionTypes[TraceType.ReturnArgument] = true;
expressionTypes[TraceType.ThrowArgument] = true;
expressionTypes[TraceType.Identifier] = true;
expressionTypes[TraceType.Literal] = true;

export function isTraceExpression(traceType) {
  return expressionTypes[traceType];
}

const callbackTypes = new Array(TraceType.getValueMaxIndex()).map(() => false);
callbackTypes[TraceType.CallbackArgument] = true;
callbackTypes[TraceType.PushCallback] = true;
callbackTypes[TraceType.PopCallback] = true;

export function isCallbackRelatedTrace(traceType) {
  return callbackTypes[traceType];
}


const dataOnlyTypes = new Array(TraceType.getValueMaxIndex()).map(() => false);
dataOnlyTypes[TraceType.CallArgument] = true;
dataOnlyTypes[TraceType.ExpressionValue] = true;
dataOnlyTypes[TraceType.Literal] = true;

/**
 * Traces that are important for data flow analysis, but not important for control flow analysis
 */
export function isDataOnlyTrace(traceType) {
  return dataOnlyTypes[traceType];
}

export function isBeforeCallExpression(traceType) {
  return TraceType.is.BeforeCallExpression(traceType);
}

export function isTraceThrow(traceType) {
  return TraceType.is.ThrowArgument(traceType);
}

// export function isPlainExpressionValue(traceType) {
//   return TraceType.is.ExpressionValue(traceType);
// }

export function isPopTrace(traceType) {
  return TraceType.is.PopImmediate(traceType);
}

export default TraceType;