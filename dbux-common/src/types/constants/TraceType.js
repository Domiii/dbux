import Enum from '../../util/Enum';

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

  /**
   * A branch statement
   */
  BranchStatement: 9,
  BranchExpression: 10,
  /**
   * Dedicated branch push.
   * NOTE: Not all branches have one. Use `controlRole` for this.
   */
  BranchPush: 11,
  /**
   * Dedicated branch pop.
   * NOTE: Not all branches have one. Use `controlRole` for this.
   */
  BranchPop: 12,

  /**
   * Dedicated decision branch.
   * NOTE: Not all branches have one. Use `controlRole` for this.
   */
  BranchDecision: 13,

  Statement: 14,
  BlockStart: 15,
  BlockEnd: 16,

  // Return
  ReturnArgument: 17,
  ReturnNoArgument: 18,

  // Throw
  ThrowArgument: 19,

  // Await
  Await: 20,
  ResumeAsync: 21,
  

  // AwaitCallExpression: 1,
  // ReturnAwait: 1,
  // ReturnAwaitCallExpression: 1,

  EndOfContext: 22,

  /**
   * FinallyStart
   */
  Finally: 23,
  /**
   * CatchStart
   */
  Catch: 24,
  TryExit: 25,
  FinallyExit: 26,


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
  ClassProperty: 45,

  Yield: 50,
  ResumeGen: 51,

  PatternAssignment: 60,
  PatternWriteVar: 61,
  PatternWriteAndDeclareVar: 62,
  PatternWriteME: 63,

  /**
   * Meta trace type is used in some rare circumstances where we don't care about a StaticTrace itself,
   * but only about some data we associate with it.
   */
  Meta: 70
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

const traceReturnOrBranchPopTypes = [...returnTraceTypes];
traceReturnOrBranchPopTypes[TraceType.BranchPop] = true;
export function isTraceReturnOrBranchPop(traceType) {
  return traceReturnOrBranchPopTypes[traceType] || false;
}


const functionExitTypes = [...returnTraceTypes];
// functionExitTypes[TraceType.ThrowArgument] = true;
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
expressionTypes[TraceType.BranchExpression] = true;
expressionTypes[TraceType.ExpressionValue] = true;
expressionTypes[TraceType.CallExpressionResult] = true;
expressionTypes[TraceType.UpdateExpression] = true;
expressionTypes[TraceType.Identifier] = true;
expressionTypes[TraceType.Literal] = true;
expressionTypes[TraceType.ME] = true;
expressionTypes[TraceType.PatternAssignment] = true;
// expressionTypes[TraceType.ReturnArgument] = true;
// expressionTypes[TraceType.ThrowArgument] = true;

export function isTraceExpression(traceType) {
  return expressionTypes[traceType];
}


const dataOnlyTypes = new Array(TraceType.getValueMaxIndex()).map(() => false);
dataOnlyTypes[TraceType.ExpressionValue] = true;
dataOnlyTypes[TraceType.Identifier] = true;
dataOnlyTypes[TraceType.Literal] = true;

/**
 * Expression types that were... to be skipped when navigating "over" traces(?)
 * NOTE: not very important
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
// TODO: this messes things up with ClassMethod (→ breaks `class5.js` and friends)
// declarationTypes[TraceType.FunctionDefinition] = true;
declarationTypes[TraceType.ClassDeclaration] = true;
declarationTypes[TraceType.DeclareAndWriteVar] = true;
declarationTypes[TraceType.Param] = true;
declarationTypes[TraceType.CatchParam] = true;
declarationTypes[TraceType.PatternWriteAndDeclareVar] = true;

export function isDeclarationTrace(traceType) {
  return declarationTypes[traceType];
}

const classTypes = new Array(TraceType.getValueMaxIndex()).map(() => false);
classTypes[TraceType.ClassDeclaration] = true;
classTypes[TraceType.ClassDefinition] = true;
// classTypes[TraceType.ClassInstance] = true;

export function isClassDefinitionTrace(traceType) {
  return classTypes[traceType];
}

// NOTE: classes are also functions (but not for our intents and purposes)
const functionTypes = [];
functionTypes[TraceType.FunctionDeclaration] = true;
functionTypes[TraceType.FunctionDefinition] = true;

export function isFunctionDefinitionTrace(traceType) {
  return functionTypes[traceType];
}

export default TraceType;
