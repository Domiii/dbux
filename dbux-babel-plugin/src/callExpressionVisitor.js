import * as t from '@babel/types';
import { getAllClassParents } from './helpers/astGetters';


/**
 * NOTE: Wrap recursively
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
  const assignmentExpressions = [];
}

function instrumentCallbackSchedulingMaybe() {

}

function buildWrapScheduleCallbackArg(callPath, state, iArg) {
  const staticContextId = ;
  const schedulerId = ;
  const cb = ;
  return buildSource(`scheduleCallback(staticContextId, schedulerId, cb)`);
}

function instrumentCallbackSchedulingArg(callPath, state, iArg) {
  const wrapped = buildWrapScheduleCallbackArg(arg, ..., iArg);
  argPath.replaceWith(wrapped);
}

function instrumentCallbackSchedulingFunctionArgs(callPath, state) {
  for (let i = 0; i < args.length; ++i) {
    const argPath = args[i];
    if (t.isFunction(argPath)) {
      const wrapped = buildWrapScheduleCallbackArg(arg, ..., i);
      argPath.replaceWith(wrapped);
    }
  }
}

export function callVisitor() {
  return {
    enter(path, state) {
      if (options.instrumentAllFunctionCalls) {
        instrumentCallbackSchedulingMaybe(path, state);
      }
      else if (hasFunctionArgument(path)) {
        // e.g. `myFun(1, 2, () => { doSomething(); }, function() { doSomethingElse(); })`
        instrumentCallbackSchedulingFunctionArgs(path, state);
      }
      else if (isKnownCallbackSchedulingCall(path)) {
        // setTimeout, setInterval, then, process.next etc.
        instrumentCallbackSchedulingArg(path, state, 0);
      }
      else if (isKnownBlockingCall(path)) {
        // alert, prompt etc.
        // TODO
      }
    }
  };
}
