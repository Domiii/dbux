import Enum from '../../util/Enum';

// eslint-disable-next-line import/no-mutable-exports
const traceTypeObj = {
  PushImmediate: 1,
  PopImmediate: 2,

  BeforeExpression: 3,
  /**
   * NOTE: `BeforeCallExpression` is now also a function's `Callee`, meaning it also holds a value.
   */
  BeforeCallExpression: 4,
  // /**
  //  * E.g. `a.b.c` for `a.b.c.f()` method call.
  //  * Not traced for `f()` (no object involved).
  //  */
  CallExpressionResult: 6,
  ExpressionResult: 7,
  ExpressionValue: 8,

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

  // Await
  Await: 20,
  Resume: 21,
  

  // AwaitCallExpression: 1,
  // ReturnAwait: 1,
  // ReturnAwaitCallExpression: 1,

  EndOfContext: 22,


  Declaration: 30,
  /**
   * NOTE: Mostly `AssignmentExpression`
   * @example `x = 3`, `x = 5`
   */
  WriteVar: 31,
  /**
   * `VariableDeclarator`'s `init`
   */
  DeclareAndWriteVar: 32,
  /**
   * WriteMemberExpression
   * NOTE: Can only be `AssignmentExpression`
   * @example `o.x = 3`
   */
  WriteME: 33,
  UpdateExpression: 34,
  Identifier: 35,
  Literal: 36,
  /**
   * MemberExpression
   * @example `o.x`, `f(x)[g(y)]`
   */
  ME: 37,

  Param: 38,
  CatchParam: 39,

  FunctionDeclaration: 41,
  FunctionDefinition: 42,
  ClassDeclaration: 43,
  ClassDefinition: 44,
  ClassInstance: 45,
  ClassProperty: 45
};

/**
 * @type {(Enum|typeof traceTypeObj)}
 */
const TraceType = new Enum(traceTypeObj);

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
// dynamicTypeTypes[TraceType.CallbackArgument] = true;  
// might be shared w/ CallbackArgument, PushCallback + PopCallback

export function hasDynamicTypes(traceType) {
  return dynamicTypeTypes[traceType];
}


const expressionTypes = new Array(TraceType.getValueMaxIndex()).map(() => false);
expressionTypes[TraceType.BeforeCallExpression] = true;
expressionTypes[TraceType.ExpressionResult] = true;
expressionTypes[TraceType.ExpressionValue] = true;
expressionTypes[TraceType.CallExpressionResult] = true;
expressionTypes[TraceType.UpdateExpression] = true;
expressionTypes[TraceType.Identifier] = true;
expressionTypes[TraceType.Literal] = true;
expressionTypes[TraceType.ME] = true;
// expressionTypes[TraceType.ReturnArgument] = true;
// expressionTypes[TraceType.ThrowArgument] = true;

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
dataOnlyTypes[TraceType.ExpressionValue] = true;
dataOnlyTypes[TraceType.Identifier] = true;
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

const declarationTypes = new Array(TraceType.getValueMaxIndex()).map(() => false);
declarationTypes[TraceType.Declaration] = true;
declarationTypes[TraceType.FunctionDeclaration] = true;
declarationTypes[TraceType.ClassDeclaration] = true;
declarationTypes[TraceType.DeclareAndWriteVar] = true;
declarationTypes[TraceType.Param] = true;
declarationTypes[TraceType.CatchParam] = true;

export function isDeclarationTrace(traceType) {
  return declarationTypes[traceType];
}

const classTypes = new Array(TraceType.getValueMaxIndex()).map(() => false);
classTypes[TraceType.ClassDeclaration] = true;
classTypes[TraceType.ClassDefinition] = true;
classTypes[TraceType.ClassInstance] = true;

export function isClassDefinitionTrace(traceType) {
  return classTypes[traceType];
}

// NOTE: classes are also functions
const functionTypes = [...classTypes];
functionTypes[TraceType.FunctionDeclaration] = true;
functionTypes[TraceType.FunctionDefinition] = true;

export function isFunctionDefinitionTrace(traceType) {
  return functionTypes[traceType];
}

export default TraceType;
