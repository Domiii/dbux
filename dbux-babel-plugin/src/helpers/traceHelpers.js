import template from '@babel/template';
import * as t from '@babel/types';
import TraceType from 'dbux-common/src/core/constants/TraceType';
import EmptyObject from 'dbux-common/src/util/EmptyObject';
import { getPathTraceId } from './instrumentationHelper';


// ###########################################################################
// builders + utilities
// ###########################################################################

function replaceWithTemplate(templ, path, cfg) {
  const newNode = templ(cfg);
  path.replaceWith(newNode);
}

export const buildTraceNoValue = function buildTraceNoValue(templ, path, state, traceType) {
  const { ids: { dbux } } = state;
  const traceId = state.traces.addTrace(path, traceType);
  return templ({
    dbux,
    traceId: t.numericLiteral(traceId)
  });
}.bind(null, template('%%dbux%%.t(%%traceId%%)'));


/**
 * NOTE: We cannot reliably use templates for this, because 
 * it sometimes generates `ExpressionStatement` instead of `CallExpression`.
 * (specifically, when trying to wrap a `spreadArgument`)
 */
function buildTraceExpr(expressionPath, state, methodName, traceType, cfg) {
  const tracePath = cfg?.tracePath;
  const traceId = state.traces.addTrace(tracePath || expressionPath, traceType, null, cfg);
  const { ids: { dbux } } = state;

  return t.callExpression(
    t.memberExpression(
      t.identifier(dbux),
      t.identifier(methodName)
    ),
    [
      t.numericLiteral(traceId),
      expressionPath.node
    ]
  );
}


// ###########################################################################
// traces
// ###########################################################################

export function traceWrapExpression(traceType, path, state, tracePath) {
  return _traceWrapExpression(
    'traceExpr',
    traceType,
    path,
    state,
    {
      tracePath
    }
  );
}


function instrumentArgs(callPath, state, beforeCallTraceId) {
  const args = callPath.node.arguments;
  const replacements = [];

  for (let i = 0; i < args.length; ++i) {
    // if (t.isFunction(args[i])) {
    //   instrumentCallbackSchedulingArg(callPath, state, i);
    // }
    // else {
    const argPath = callPath.get('arguments.' + i);
    const argTraceId = getPathTraceId(argPath);
    // const argContextId = !argTraceId && getPathContextId(argPath) || null;
    if (!argTraceId) {
      // not instrumented yet -> add trace
      replacements.push(() => traceWrapArg(argPath, state, beforeCallTraceId));
    }
    else { // if (argTraceId) {
      // has been instrumented and has a trace -> just set it's callId
      // Example: in `f(await g())` `await g()` has already been instrumented by `awaitVisitor`
      const argTrace = state.getTrace(argTraceId);
      argTrace._callId = beforeCallTraceId;
    }
  }

  // TODO: I deferred to here because I felt it was safer this way,
  //    but might not need to defer at all.
  replacements.forEach(r => r());
}

export function traceCallExpression(callPath, state, beforeCallTraceId) {
  const originalCallPath = _traceWrapExpression('traceExpr', TraceType.CallExpressionResult, callPath, state, {
    resultCallId: beforeCallTraceId
  });

  instrumentArgs(originalCallPath, state, beforeCallTraceId);

  // NOTE: trace "before" an expression is not right before it actually executes the call.
  //    The last code ran before a function is executed is the evaluation of the last argument.
  //   const newNode = buildTraceExprBeforeAndAfter(expressionPath, state);
  //   expressionPath.replaceWith(newNode);
  //   state.onCopy(expressionPath, expressionPath.get('expressions.1.arguments.1'), 'trace');
}


export function traceWrapArg(argPath, state, beforeCallTraceId) {
  const tracePath = argPath;
  if (argPath.isSpreadElement()) {
    argPath = argPath.get('argument');
  }
  return _traceWrapExpression('traceArg', TraceType.CallArgument, argPath, state, {
    callId: beforeCallTraceId,
    tracePath
  });
}

function _traceWrapExpression(methodName, traceType, expressionPath, state, cfg) {
  // if (t.isLiteral(node)) {
  //   // don't care about literals
  //   return;
  // }
  const newNode = buildTraceExpr(expressionPath, state, methodName, traceType, cfg);
  expressionPath.replaceWith(newNode);

  const orig = expressionPath.get('arguments.1');
  state.onCopy(expressionPath, orig, 'trace');
  return orig;
}


export const traceBeforeExpression = function traceBeforeExpression(templ, expressionPath, state, traceType, tracePath) {
  const { ids: { dbux } } = state;
  const traceId = state.traces.addTrace(tracePath || expressionPath, traceType || TraceType.BeforeExpression);
  replaceWithTemplate(templ, expressionPath, {
    dbux,
    traceId: t.numericLiteral(traceId),
    expression: expressionPath.node
  });

  // prevent infinite loop
  const originalPath = expressionPath.get('expressions.1');
  state.onCopy(expressionPath, originalPath, 'trace');
  return originalPath;
}.bind(null, template('%%dbux%%.t(%%traceId%%), %%expression%%'));
