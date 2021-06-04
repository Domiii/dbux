import { buildTraceCallDefault, buildTraceCallME } from './builders/callExpressions';


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
// traceCallExpressionDefault
// ###########################################################################


export function traceCallExpressionDefault(path, state, traceCfg) {
  const newNode = buildTraceCallDefault(state, traceCfg);
  path.replaceWith(newNode);

  // NOTE: `onCopy` should not be necessary anymore, since nested paths should already have finished instrumentation
  // const calleeNew = path.get('arguments.0.right');
}

// ###########################################################################
// traceCallExpressionME
// ###########################################################################

export function traceCallExpressionME(path, state, traceCfg) {
  const newNode = buildTraceCallME(state, traceCfg);
  path.replaceWith(newNode);

  // NOTE: `onCopy` should not be necessary anymore, since nested paths should already have finished instrumentation
  // onCopy(callee)
  // args.forEach(arg => onCopy(arg))
  // onCopy(result)
}