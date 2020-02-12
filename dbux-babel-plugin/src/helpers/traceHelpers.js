import template from '@babel/template';
import * as t from '@babel/types';
import TraceType from 'dbux-common/src/core/constants/TraceType';


// ###########################################################################
// templates + instrumentation
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

/**
 * We cannot reliably use templates for this, because 
 * it sometimes generates `ExpressionStatement` instead of `CallExpression`.
 * (specifically, when trying to wrap a `spreadArgument`)
 */
function buildTraceExpr(expressionPath, state, methodName, traceType, originalPath) {
  const traceId = state.addTrace(originalPath || expressionPath, traceType);
  const { ids: { dbux } } = state;

  return t.callExpression(
    t.memberExpression(
      t.identifier(dbux),
      t.identifier(methodName)
    ), [
      t.numericLiteral(traceId),
      expressionPath.node
    ]
  );
}


export const traceWrapExpression = _traceWrapExpression.bind(
  null,
  'traceExpr',
  TraceType.ExpressionResult
);

export function traceWrapArg(argPath, state) {
  const originalPath = argPath;
  if (argPath.isSpreadElement()) {
    argPath = argPath.get('argument');
  }
  _traceWrapExpression('traceArg', TraceType.CallArgument, argPath, state, originalPath);
}

function _traceWrapExpression(methodName, traceType, expressionPath, state, originalPath = null) {
  // if (t.isLiteral(node)) {
  //   // don't care about literals
  //   return;
  // }
  const newNode = buildTraceExpr(expressionPath, state, methodName, traceType, originalPath);
  expressionPath.replaceWith(newNode);

  state.onCopy(expressionPath, expressionPath.get('arguments.1'), 'trace');
}


export const traceBeforeExpression = function traceBeforeExpression(templ, expressionPath, state) {
  const { ids: { dbux } } = state;
  const traceId = state.addTrace(expressionPath, TraceType.BeforeExpression);
  replaceWithTemplate(templ, expressionPath, {
    dbux,
    traceId: t.numericLiteral(traceId),
    expression: expressionPath.node
  });

  // prevent infinite loop
  state.onCopy(expressionPath, expressionPath.get('expressions.1'), 'trace');
}.bind(null, template('%%dbux%%.t(%%traceId%%), %%expression%%'));
