import template from '@babel/template';
import * as t from '@babel/types';
import TraceType from 'dbux-common/src/core/constants/TraceType';
import { getPathTraceId } from '../data/StaticTraceCollection';
import { isPathInstrumented, isNodeInstrumented } from './instrumentationHelper';


export function getTracePath(path) {
  // TODO: should we merge the override into the config? (-> so far only one use-case for that, and it might vary with different situations, so just hack it for now)
  const cfg = path.getData('visitorCfg');
  const originalIsParentOverride = path.getData('originalIsParent');
  if (originalIsParentOverride === false) {
    // override of settings for synthetic nodes
    // NOTE: because of the way we instrument call expressions, the callee will be handled here for a `AssignmentExpression.right` which has `originalIsParent` but should not apply here
    return path;
  }

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

// export function traceBeforeSuper(path, state) {
//   // find the first ancestor that is a statement
//   const statementPath = path.findParent(ancestor => ancestor.isStatement());

//   // cannot wrap `super` -> trace `this` *before* the current statement instead
//   // NOTE: we don't want to flag the `statementPath` as visited/instrumented
//   const newNode = buildTraceExpr(getOrCreateNode(t.thisExpression()), state, 'traceExpr', TraceType.ExpressionValue, { tracePath: path });
//   statementPath.insertBefore(t.expressionStatement(newNode));
// }

// ###########################################################################
// call enter
// ###########################################################################

/**
 * NOTE: the call templates do not have arguments.
 * We will push them in manually.
 */
const callTemplatesMember = {
  // NOTE: `f.call.call(f, args)` also works (i.e. function f(x) { console.log(this, x); } f.call(this, 1); // -> f.call.call(f, this, 1))
  CallExpression: () => template(`
  %%o%% = %%oNode%%,
    %%f%% = %%fNode%%,
    null,
    %%f%%.call(%%o%%)
  `),

  /**
   * @see https://github.com/babel/babel/blob/master/packages/babel-plugin-proposal-optional-chaining/src/index.js
   */
  OptionalCallExpression: () => template(`
  %%o%% = %%oNode%%,
    %%f%% = %%fNode%%,
    null,
    %%f%%?.call(%%o%%)
  `),

  NewExpression: () => template(`
  %%o%% = %%oNode%%,
    %%f%% = %%fNode%%,
    null,
    new %%f%%()
`)
};

const callTemplatesDefault = {
  CallExpression: template(
    `
    %%f%%()
  `),

  /**
   * @see https://github.com/babel/babel/blob/master/packages/babel-plugin-proposal-optional-chaining/src/index.js
   */
  OptionalCallExpression: template(
    `
    %%f%%?.()
  `),

  NewExpression: template(
    `
    new %%f%%()
  `)
};

// TODO: the name chosen here will show up in error messages -> get proper displayName for callee instead
function getCalleeDisplayName(calleePath) {
  return calleePath.node.name || 'func';
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
 * 
 * NOTEs:
 * * We do *NOT* instrument here, because it would mess up `staticTraceId` order (e.g. in `f(u).g(v)`).
 * * `oNode` (including `super`) and `fNode` will be traced as `ExpressionResult` (via `AssignmentExpression.right`)
 */
const instrumentMemberCallExpressionEnter =
  (function instrumentBeforeMemberCallExpression(path, state) {
    const calleePath = path.get('callee');
    const oPath = calleePath.get('object');
    const fIdPath = calleePath.get('property');
    const argPath = path.get('arguments');

    // const oTraceId = state.traces.addTrace(oPath, TraceType.ExpressionValue);
    // const calleeTraceId = state.traces.addTrace(calleePath, TraceType.BeforeCallExpression);

    // NOTE: we need to get loc before instrumentation
    const { loc } = path.node;
    const calleeLoc = calleePath.node.loc;

    // build
    // const { ids: { dbux } } = state;

    const o = path.scope.generateDeclaredUidIdentifier('o');
    const f = path.scope.generateDeclaredUidIdentifier(getCalleeDisplayName(calleePath));

    const fNode = t.cloneNode(calleePath.node);
    // = computed ?
    //   (optional ? '%%o%%?.[%%fId%%]' : '%%o%%[%%fId%%]') :
    //   (optional ? '%%o%%?.%%fId%%' : '%%o%%.%%fId%%')
    fNode.object = o;
    fNode.property = fIdPath.node;


    const templ = callTemplatesMember[path.type]();
    replaceWithTemplate(templ, path, {
      // dbux,
      o,
      f,
      // oTraceId: t.numericLiteral(oTraceId),
      // calleeTraceId: t.numericLiteral(calleeTraceId),
      oNode: oPath.node,
      fNode
    });


    // set loc, so new nodes will be instrumented correctly
    const oPathId = 'expressions.0.right';
    const calleePathId = 'expressions.1.right';
    const bcePathId = 'expressions.2';
    const newPath = path.get('expressions.3');

    // hackfix: put `o` and `args` in as-is; since they are still going to get instrumented and cloning in templates is not guaranteed to keep all properties
    path.node.expressions[0].right = oPath.node;
    newPath.node.arguments.push(...argPath.map(p => p.node));

    const newOPath = path.get(oPathId);
    const newCalleePath = path.get(calleePathId);

    newCalleePath.node.loc = calleeLoc;
    newPath.node.loc = loc;

    // keep path data
    state.onCopy(path, newPath);

    // prepare for later
    // newPath.setData('_calleePath', calleePathId);
    newOPath.setData('originalIsParent', false);
    newOPath.setData('resultType', TraceType.ExpressionValue);
    newCalleePath.setData('originalIsParent', false);
    newPath.setData('_bcePathId', bcePathId);

    return newPath;
  });

/**
 * Convert `f(...args)` to: `traceBCE(f), f(...args)` to trace callee (`f`) and place BCE correctly
 * 
 */
const instrumentDefaultCallExpressionEnter =
  (function instrumentBeforeCallExpressionDefault(path, state) {
    const calleePath = path.get('callee');
    const argPath = path.get('arguments');

    // const calleeTraceId = state.traces.addTrace(calleePath, TraceType.BeforeCallExpression);
    const { loc } = path.node;
    const calleeLoc = calleePath.node.loc;

    // build
    // const { ids: { dbux } } = state;

    const f = path.scope.generateDeclaredUidIdentifier(getCalleeDisplayName(calleePath));

    // super needs special treatment
    const isSuper = calleePath.isSuper();

    // replace with our custom callee
    if (!isSuper) {   // NOTE: `super` cannot be replaced
      const templ = callTemplatesDefault[path.type];

      // f(...)
      replaceWithTemplate(templ, path, {
        f
      });
    }

    // prepend actual call with (i) callee assignment + (ii) BCE placeholder
    path.replaceWith(t.sequenceExpression([
      // (i) callee assignment (%%f%% = %%fNode%%)
      //    NOTE: super cannot be assigned, so we set it to `null` (`f` will not be used in that case)
      isSuper &&
      t.nullLiteral() ||
      t.assignmentExpression('=',
        f,
        calleePath.node
      ),

      // (ii) BCE placeholder
      t.nullLiteral(),

      // (iii) actual call
      path.node
    ]));

    // state.markEntered(originalPath, 'trace');

    // set loc, so it gets instrumented on exit as well
    const calleePathId = 'expressions.0';
    const bcePathId = 'expressions.1';
    const newPath = path.get('expressions.2');
    const newCalleePath = path.get(calleePathId);

    // hackfix: put `args` in as-is; they are still going to get instrumented
    newPath.node.arguments = argPath.map(p => p.node);

    if (!isSuper) {
      newCalleePath.node.loc = calleeLoc;
    }
    newPath.node.loc = loc;


    // keep path data
    state.onCopy(path, newPath);

    // prepare for later
    // newPath.setData('_calleePath', calleePathId);
    newPath.setData('_bcePathId', bcePathId);
    newCalleePath.setData('originalIsParent', false);

    // set loc on actual call, so it gets instrumented on exit as well
    // originalPath.node.loc = path.node.loc;

    return newPath;
  });

export function instrumentCallExpressionEnter(path, state) {
  const calleePath = path.get('callee');
  if (calleePath.isMemberExpression()) {
    return instrumentMemberCallExpressionEnter(path, state);
  }
  else {
    return instrumentDefaultCallExpressionEnter(path, state);
    // const tracePath = getTracePath(path);
    // return traceBeforeExpression(TraceType.BeforeCallExpression, path, state, tracePath);
  }
}


// ###########################################################################
// call exit
// ###########################################################################


function instrumentArgs(callPath, state, beforeCallTraceId) {
  const args = callPath.node.arguments;

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


export function traceCallExpression(callPath, state, resultType) {
  const bcePathId = callPath.getData('_bcePathId');

  const bcePath = bcePathId && callPath.parentPath.get(bcePathId) || null;

  // if (!getPathTraceId(calleePath) && !isPathInstrumented(calleePath)) {
  //   // trace callee, if not traced before (left-hand side of parenthesis; e.g. `o.f` in `o.f(x)`)
  //   traceWrapExpression(TraceType.ExpressionValue, calleePath, state);
  // }

  // trace BCE
  const bceNode = buildTraceNoValue(callPath, state, TraceType.BeforeCallExpression);
  const bceTraceId = getPathTraceId(callPath);
  bcePath.replaceWith(bceNode);

  instrumentArgs(callPath, state, bceTraceId);
  //const originalCallPath = 
  _traceWrapExpression('traceExpr', resultType, callPath, state, {
    resultCallId: bceTraceId,
    // tracePath
  });
}