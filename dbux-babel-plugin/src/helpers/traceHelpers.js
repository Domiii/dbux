import template from '@babel/template';
import * as t from '@babel/types';
import TraceType from 'dbux-common/src/core/constants/TraceType';
import EmptyObject from 'dbux-common/src/util/EmptyObject';


// ###########################################################################
// templates
// ###########################################################################

// ###########################################################################
// instrumentation
// ###########################################################################

function replaceWithTemplate(templ, path, cfg) {
  const newNode = templ(cfg);
  path.replaceWith(newNode);
}

export const buildTraceNoValue = function buildTraceNoValue(templ, path, state, traceType) {
  const { ids: { dbux } } = state;
  const traceId = state.addTrace(path, traceType);
  return templ({
    dbux,
    traceId: t.numericLiteral(traceId)
  });
}.bind(null, template('%%dbux%%.t(%%traceId%%)'));


// function buildTraceExprBeforeAndAfter(expressionPath, state) {
//   const traceIdBefore = state.addTrace(expressionPath, TraceType.BeforeExpression);
//   const traceIdAfter = state.addTrace(expressionPath, TraceType.ExpressionResult);
//   const { ids: { dbux } } = state;

//   return t.sequenceExpression([
//     t.callExpression(
//       t.memberExpression(
//         t.identifier(dbux),
//         t.identifier('t')
//       ),
//       [
//         t.numericLiteral(traceIdBefore)
//       ]
//     ),
//     t.callExpression(
//       t.memberExpression(
//         t.identifier(dbux),
//         t.identifier('traceExpr')
//       ),
//       [
//         t.numericLiteral(traceIdAfter),
//         expressionPath.node
//       ]
//     )
//   ]);
// }

/**
 * We cannot reliably use templates for this, because 
 * it sometimes generates `ExpressionStatement` instead of `CallExpression`.
 * (specifically, when trying to wrap a `spreadArgument`)
 */
function buildTraceExpr(expressionPath, state, methodName, traceType, cfg) {
  const tracePath = cfg?.tracePath;
  const traceId = state.addTrace(tracePath || expressionPath, traceType, null, cfg);
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

export function traceCallExpression(callPath, state, calleeTraceId) {
  return _traceWrapExpression('traceExpr', TraceType.CallExpressionResult, callPath, state, {
    resultCalleeId: calleeTraceId
  });

  // NOTE: trace "before" an expression is not right before it actually executes the call.
  //    The last code ran before a function is executed is the evaluation of the last argument.
  //   const newNode = buildTraceExprBeforeAndAfter(expressionPath, state);
  //   expressionPath.replaceWith(newNode);
  //   state.onCopy(expressionPath, expressionPath.get('expressions.1.arguments.1'), 'trace');
}


export function traceWrapArg(argPath, state, calleeTraceId) {
  const tracePath = argPath;
  if (argPath.isSpreadElement()) {
    argPath = argPath.get('argument');
  }
  return _traceWrapExpression('traceArg', TraceType.CallArgument, argPath, state, {
    calleeId: calleeTraceId,
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


export const traceBeforeExpression = function traceBeforeExpression(templ, expressionPath, state, traceType, cfg) {
  const { ids: { dbux } } = state;
  const traceId = state.addTrace(expressionPath, traceType || TraceType.BeforeExpression);
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
