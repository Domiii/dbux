import TraceType from '@dbux/common/src/core/constants/TraceType';
import { buildTraceNoValue } from '../zz_archive/traceHelpers.old';
import { traceWrapExpression } from './trace';


export function instrumentCallExpressionEnter(path, state) {
  const calleePath = path.get('callee');

  if (isAnyMemberExpression(calleePath)) {
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


// function instrumentArgs(callPath, state, beforeCallTraceId) {
//   const calleePath = callPath.get('callee');
//   if (!getCanTraceArgs(calleePath)) {
//     return;
//   }

//   const args = callPath.node.arguments;

//   for (let i = 0; i < args.length; ++i) {
//     // if (t.isFunction(args[i])) {
//     //   instrumentCallbackSchedulingArg(callPath, state, i);
//     // }
//     // else {
//     const argPath = callPath.get('arguments.' + i);
//     if (!argPath.node.loc && !argPath.getData('traceResultType')) {
//       // synthetic node -> ignore
//       // E.g.: we replace `o.f(x)` with `_o = ..., _f = ..., f.call(o, x)`, and we do not want to trace `o` in `call`
//       continue;
//     }

//     const argTraceId = getPathTraceId(argPath);
//     // const argContextId = !argTraceId && getPathContextId(argPath) || null;
//     if (!argTraceId) {
//       // not instrumented yet -> add trace
//       // replacements.push(() => 
//       traceWrapArg(argPath, state, beforeCallTraceId);
//       // );
//     }
//     else { // if (argTraceId) {
//       // has been instrumented and has a trace -> just set it's callId
//       // Example: in `f(await g())` `await g()` has already been instrumented by `awaitVisitor`
//       const argTrace = state.traces.getById(argTraceId);
//       argTrace._callId = beforeCallTraceId;
//     }
//   }
// }


// export function traceWrapArg(argPath, state, beforeCallTraceId) {
//   const tracePath = argPath;
//   if (argPath.isSpreadElement()) {
//     argPath = argPath.get('argument');
//   }
//   const traceType = argPath.getData('traceResultType') || TraceType.CallArgument;
//   return _traceWrapExpression('traceArg', traceType, argPath, state, {
//     callId: beforeCallTraceId,
//     tracePath
//   });
// }

// ###########################################################################
// traceCallExpression
// ###########################################################################

export function traceCallExpression(path, state, traceCfg) {
  // if (!getPathTraceId(calleePath) && !isPathInstrumented(calleePath)) {
  //   // trace callee, if not traced before (left-hand side of parenthesis; e.g. `o.f` in `o.f(x)`)
  //   traceWrapExpression(TraceType.ExpressionValue, calleePath, state);
  // }

  // trace BCE
  if (bcePath) {
    const bceNode = buildTraceNoValue(path, state, TraceType.BeforeCallExpression);
    bcePath.replaceWith(bceNode);
  }

  // trace args + return value
  if (bceTraceId) {
    // return value 
    // TODO: resultCallId: bceTraceId
    traceWrapExpression(path, state, traceCfg);
    // {
    //   resultCallId: bceTraceId,
    //   // tracePath
    // }
  }
}