import template from '@babel/template';
import * as t from '@babel/types';
import TraceType from 'dbux-common/src/core/constants/TraceType';
import { getPathTraceId } from '../data/StaticTraceCollection';
import { isPathInstrumented } from './instrumentationHelper';


export function getTracePath(path) {
  const cfg = path.getData('visitorCfg');
  const originalIsParent = cfg?.originalIsParent;
  if (originalIsParent) {
    // this expression is represented by the parentPath, instead of just the value path
    // NOTE: we try to find the first parent path that is an expression and not instrumented
    let tracePath = path.parentPath;
    while (tracePath && !tracePath.isStatement() && isPathInstrumented(tracePath)) {
      tracePath = tracePath.parentPath;
    }
    if (tracePath && (tracePath.isStatement() || isPathInstrumented(tracePath))) {
      // invalid path
      tracePath = null;
    }
    return tracePath;
  }
  return null;
}

// ###########################################################################
// builders + utilities
// ###########################################################################

function replaceWithTemplate(templ, path, cfg) {
  let newNode = templ(cfg);
  if (path.isExpression() && newNode.type === 'ExpressionStatement') {
    // we wanted an expression, not a statement
    newNode = newNode.expression;
  }
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
 * (specifically, that is when trying to wrap a `spreadArgument`)
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

export function traceWrapExpression(traceType, path, state, tracePath, markVisited = true) {
  return _traceWrapExpression(
    'traceExpr',
    traceType,
    path,
    state,
    {
      tracePath
    },
    markVisited
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
    if (!argPath.node.loc) {
      // synthetic node -> ignore
      //  e.g. we replace `o.f(x)` with `[...] o.call(o, x)`, 
      //      and we do not want to trace the `o` arg here
      continue;
    }

    const argTraceId = getPathTraceId(argPath);
    // const argContextId = !argTraceId && getPathContextId(argPath) || null;
    if (!argTraceId) {
      // not instrumented yet -> add trace
      // replacements.push(() => 
      traceWrapArg(argPath, state, beforeCallTraceId);
      // );
    }
    else { // if (argTraceId) {
      // has been instrumented and has a trace -> just set it's callId
      // Example: in `f(await g())` `await g()` has already been instrumented by `awaitVisitor`
      const argTrace = state.traces.getById(argTraceId);
      argTrace._callId = beforeCallTraceId;
    }
  }

  // // TODO: I deferred to here because I felt it was safer this way,
  // //    but might not need to defer at all.
  // replacements.forEach(r => r());
}

export function traceCallExpression(callPath, state, resultType, beforeCallTraceId, tracePath = null) {
  instrumentArgs(callPath, state, beforeCallTraceId);
  //const originalCallPath = 
  _traceWrapExpression('traceExpr', resultType, callPath, state, {
    resultCallId: beforeCallTraceId,
    tracePath
  });

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

function _traceWrapExpression(methodName, traceType, expressionPath, state, cfg, markVisited = true) {
  // if (t.isLiteral(node)) {
  //   // don't care about literals
  //   return;
  // }
  const newNode = buildTraceExpr(expressionPath, state, methodName, traceType, cfg);
  expressionPath.replaceWith(newNode);

  const orig = expressionPath.get('arguments.1');
  if (markVisited) {
    state.onCopy(expressionPath, orig, 'trace');
  }
  return orig;
}

export const traceBeforeExpression = function traceBeforeExpression(
  templ, traceType, expressionPath, state, tracePath) {
  const { ids: { dbux } } = state;

  const traceId = state.traces.addTrace(tracePath || expressionPath, traceType || TraceType.BeforeExpression, null);

  replaceWithTemplate(templ, expressionPath, {
    dbux,
    traceId: t.numericLiteral(traceId),
    expression: expressionPath.node
  });

  // prevent infinite loop
  const originalPath = expressionPath.get('expressions.1');
  // prevent instrumenting `originalPath` again, and also copy all data
  state.onCopy(expressionPath, originalPath, 'trace');
  return originalPath;
}.bind(null, template('%%dbux%%.t(%%traceId%%), %%expression%%'));


export const traceValueBeforeExpression = function traceValueBeforePath(
  templ, targetPath, state, traceType, valuePath, actualValueIdName, markVisited = true) {
  const { ids: { dbux } } = state;
  const traceId = state.traces.addTrace(valuePath, traceType);

  replaceWithTemplate(templ, targetPath, {
    dbux,
    traceId: t.numericLiteral(traceId),
    expression: targetPath.node,
    value: t.identifier(actualValueIdName)
  });

  const originalTargetPath = targetPath.get('expressions.1');
  if (markVisited) {
    // prevent instrumenting `originalTargetPath` again
    state.onCopy(targetPath, originalTargetPath, 'trace');
  }
  return originalTargetPath;
}.bind(null, template('%%dbux%%.traceExpr(%%traceId%%, %%value%%), %%expression%%'));

let _thisPath;

/**
 * Re-used path of a `this` AST node.
 */
function getOrCreateThisNode() {
  if (!_thisPath) {
    _thisPath = { node: t.thisExpression() };
  }
  return _thisPath;
}

export function traceBeforeSuper(path, state) {
  // find the first ancestor that is a statement
  const statementPath = path.findParent(ancestor => ancestor.isStatement());

  // cannot wrap `super` -> trace `this` *before* the current statement instead
  // NOTE: we don't want to flag the `statementPath` as visited/instrumented
  const newNode = buildTraceExpr(getOrCreateThisNode(), state, 'traceExpr', TraceType.ExpressionValue, { tracePath: path });
  statementPath.insertBefore(t.expressionStatement(newNode));
}

/**
 * Convert `o.f(...args)` to:
 * ```
 * var _o, _f;
 * _o = traceValue(o),      // execute potential getters in `o`
 *  _f = traceBCE(_o.f),    // get f -> trace callee (BCE)
 *  _f.call(_o, ...args);   // call! (also the return value of the expression)
 * ```
 * We do this to get accurate `parentTrace` relationships, where we want to:
 *   (a) handle getters carefully
 *   (b) discern between getter and call expression on the stack
 *   (c) resolve conflicts with `super.f()`
 */
const instrumentBeforeMemberCallExpression =
  (function instrumentBeforeMemberCallExpression(templ, path, state) {
    const calleePath = path.get('callee');
    const oPath = calleePath.get('object');
    const fPath = calleePath.get('property');
    const argPath = path.get('arguments');

    const oTraceId = state.traces.addTrace(oPath, TraceType.ExpressionValue);
    const calleeTraceId = state.traces.addTrace(calleePath, TraceType.BeforeCallExpression);

    const originalLoc = path.node.loc; // NOTE: we need to get loc before instrumentation

    // build
    const { ids: { dbux } } = state;

    const o = path.scope.generateDeclaredUidIdentifier('o');
    const f = path.scope.generateDeclaredUidIdentifier(fPath.node.name);
    
    // NOTE: using this approach over template helps keep the identity of the original nodes
    //  (templates copy, rahter than re-use nodes)
    const callExpr = t.callExpression(
      t.memberExpression(f, t.identifier('call')),
      // [o, ...argPath.map(p => p.node)]
      [o]
    );

    replaceWithTemplate(templ, path, {
      dbux,
      o,
      f,
      oTraceId: t.numericLiteral(oTraceId),
      calleeTraceId: t.numericLiteral(calleeTraceId),
      oNode: oPath.node,
      fNode: fPath.node,
      callExpr
    });

    const newCallPath = path.get('expressions.2');

    // hackfix: put the arg nodes in as-is, so the args (and their entire subtree) will stay instrumentable and stay as-is
    newCallPath.node.arguments.push(...argPath.map(p => p.node));

    state.onCopy(path, newCallPath);

    // set loc on actual call, so it gets instrumented on exit as well
    newCallPath.node.loc = originalLoc;

    return newCallPath;
  }).bind(null, template(`
  %%o%% = %%dbux%%.traceExpr(%%oTraceId%%, %%oNode%%),
    %%f%% = %%dbux%%.traceExpr(%%calleeTraceId%%, %%o%%.%%fNode%%),
    // %%f%%.call(%%args%%)
    %%callExpr%%
  `));

/**
 * Convert `f(...args)` to: `traceBCE(f), f(...args)`
 * 
 */
const instrumentBeforeCallExpressionDefault =
  (function instrumentBeforeCallExpressionDefault(templ, path, state) {
    const calleePath = path.get('callee');
    // const argPath = path.get('arguments');

    const calleeTraceId = state.traces.addTrace(calleePath, TraceType.BeforeCallExpression);

    // build
    const { ids: { dbux } } = state;
    path.setData('testtest', 1);

    replaceWithTemplate(templ, path, {
      dbux,
      calleeTraceId: t.numericLiteral(calleeTraceId),
      fNode: calleePath.node,
      callExpr: path.node
    });

    const originalPath = path.get('expressions.1');
    // state.markEntered(originalPath, 'trace');

    state.onCopy(path, originalPath);

    // set loc on actual call, so it gets instrumented on exit as well
    // originalPath.node.loc = path.node.loc;

    return originalPath;
  }).bind(null, template(`
    %%dbux%%.traceExpr(%%calleeTraceId%%, %%fNode%%),
    %%callExpr%%
  `));

export function instrumentBeforeCallExpression(path, state) {
  const calleePath = path.get('callee');
  if (calleePath.isMemberExpression()) {
    return instrumentBeforeMemberCallExpression(path, state);
  }
  else {
    return instrumentBeforeCallExpressionDefault(path, state);
    // const tracePath = getTracePath(path);
    // return traceBeforeExpression(TraceType.BeforeCallExpression, path, state, tracePath);
  }
}