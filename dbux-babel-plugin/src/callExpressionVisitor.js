import * as t from '@babel/types';
import { getPresentableString } from './helpers/misc';
import { isKnownCallbackSchedulingCall } from './helpers/callExpressionHelpers';


// ###########################################################################
// builders
// ###########################################################################

/**
 * NOTE: We wrap recursively
 * 
 * E.g.:
 * 
 * const _f_arg0 = ;
 * const _f_arg1 = ;
 * // ...
 * cost _g_arg0 = f(
 *  _f_arg0 instanceof Function && wrap(_f_arg0) || _f_arg0,
 *  _f_arg1 instanceof Function && wrap(_f_arg1) || _f_arg1,
 * ...));
 * // ...
 * g(_g_arg0, ...);
 */
function buildWrapMaybeScheduleCallback(callPath, state) {
  // TODO: consider recursion problem
  // need to store stuff in state and resolve it at end of function call
  const assignmentExpressions = [];
}

function instrumentCallbackSchedulingMaybe() {
  // TODO
  // buildWrapMaybeScheduleCallback()
}

function buildWrapScheduleCallbackArg(staticId, callPath, state, iArg) {
  const { ids: { dbux }, getClosestContextIdName } = state;
  const schedulerIdName = getClosestContextIdName(callPath);
  const args = callPath.node.arguments;
  const cbArg = args[iArg];
  return t.expressionStatement(
    t.callExpression(
      t.memberExpression(t.identifier(dbux), t.identifier('scheduleCallback')),
      [t.numericLiteral(staticId), t.identifier(schedulerIdName), cbArg]
    )
  );
}

// ###########################################################################
// modification
// ###########################################################################

function instrumentCallbackSchedulingArg(staticId, callPath, state, iArg) {
  const argPath = callPath.get('arguments.' + iArg);
  const wrapped = buildWrapScheduleCallbackArg(staticId, callPath, state, iArg);
  argPath.replaceWith(wrapped);
}

function instrumentCallbackSchedulingFunctionArgs(staticId, callPath, state) {
  const args = callPath.node.arguments;
  for (let i = 0; i < args.length; ++i) {
    const arg = args[i];
    if (t.isFunction(arg)) {
      instrumentCallbackSchedulingArg(staticId, callPath, state, i);
    }
  }
}

// ###########################################################################
// misc utilities
// ###########################################################################

function hasCallFunctionArgument(callPath) {
  return !!callPath.node.arguments.find(arg => t.isFunction(arg));
}

function getCallDisplayName(path) {
  const MaxLen = 40;
  return getPresentableString(path, MaxLen);
}

function addStaticContext(path, state) {
  return state.addStaticContext({
    type: 3,
    displayName: getCallDisplayName(path)
  });
}

// ###########################################################################
// visitor
// ###########################################################################

function enter(path, state) {
  if (!state.onEnter(path)) return;

  const { options } = state;

  if (options?.instrumentAllFunctionCalls) {
    // bubble-wrap everything
    const staticId = addStaticContext(path, state);
    instrumentCallbackSchedulingMaybe(staticId, path, state);
  }
  else if (hasCallFunctionArgument(path)) {
    // e.g. `myFun(1, 2, () => { doSomething(); }, function() { doSomethingElse(); })`
    const staticId = addStaticContext(path, state);
    instrumentCallbackSchedulingFunctionArgs(staticId, path, state);
  }
  else if (isKnownCallbackSchedulingCall(path)) {
    // setTimeout, setInterval, then, process.next etc.
    const staticId = addStaticContext(path, state);
    instrumentCallbackSchedulingArg(staticId, path, state, 0);
  }
  // else if (isKnownBlockingCall(path)) {
  //   // alert, prompt etc.
  //   // TODO
  // }
}

export function callExpressionVisitor() {
  return {
    enter
  };
}
