import * as t from '@babel/types';
import { getPresentableString } from './helpers/misc';
import { isKnownCallbackSchedulingCall } from './helpers/callExpressionHelpers';


// ###########################################################################
// builders
// ###########################################################################

/**
 * Aggressive mode: wrap all args; don't let any callback slip through our fingers.
 */
function buildWrapAllArgs(callPath, state) {
  // TODO: consider recursion problem
  // need to store stuff in state and resolve it at end of function call
  const assignmentExpressions = [];
}

function instrumentCallWrapAllArgs() {
  // TODO
  // buildWrapMaybeScheduleCallback()
}

function buildWrapScheduleCallbackArg(argPath, state) {
  const { ids: { dbux }, getClosestContextIdName } = state;
  const staticId = addStaticContext(argPath, state);
  const schedulerIdName = getClosestContextIdName(argPath);
  const cbArg = argPath.node;
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

function instrumentCallbackSchedulingArg(callPath, state, i) {
  const argPath = callPath.get('arguments.' + i);
  const argWrapped = buildWrapScheduleCallbackArg(argPath, state);
  argPath.replaceWith(argWrapped);
}

function instrumentCallbackSchedulingFunctionArgs(callPath, state) {
  const args = callPath.node.arguments;
  const replacements = [];
  for (let i = 0; i < args.length; ++i) {
    if (t.isFunction(args[i])) {
      replacements.push(() => instrumentCallbackSchedulingArg(callPath, state, i));
    }
  }
  replacements.forEach(r => r());
}

// ###########################################################################
// misc utilities
// ###########################################################################

function hasCallFunctionArgument(callPath) {
  // TODO: if an arg contains a call to bind, we can be quite sure, it's a function
  // TODO: check if bindings of args reveal any function declarations
  return !!callPath.node.arguments.find(arg => t.isFunction(arg));
}

function getCallDisplayName(path) {
  const MaxLen = 30;
  return `(${getPresentableString(path.toString(), MaxLen)})`;
}

function addStaticContext(path, state) {
  return state.addStaticContext(path, {
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

  // console.log('[CALL]', path.toString());

  if (options?.instrumentAllFunctionCalls) {
    // ultra aggressive mode: bubble-wrap everything
    instrumentCallWrapAllArgs(path, state);
  }
  else if (hasCallFunctionArgument(path)) {
    // e.g. `myFun(1, 2, () => { doSomething(); }, function() { doSomethingElse(); })`
    instrumentCallbackSchedulingFunctionArgs(path, state);
  }
  else if (isKnownCallbackSchedulingCall(path)) {
    // setTimeout, setInterval, then, process.next etc.
    instrumentCallbackSchedulingArg(path, state, 0);
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
