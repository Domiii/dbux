import { buildTraceCallDefault, buildTraceCallUntraceableCallee, buildTraceCallME } from './builders/callExpressions';


// ###########################################################################
// traceCallExpressionDefault
// ###########################################################################


export function traceCallExpressionDefault(state, traceCfg) {
  let newNode;
  if (traceCfg.data.calleeVar) {
    newNode = buildTraceCallDefault(state, traceCfg);
  }
  else {
    // special treatment for untraceable callees
    newNode = buildTraceCallUntraceableCallee(state, traceCfg);
  }
  const { path } = traceCfg;
  path.replaceWith(newNode);

  // NOTE: `onCopy` should not be necessary anymore, since nested paths should already have finished instrumentation
  // const calleeNew = path.get('arguments.0.right');
}

// ###########################################################################
// traceCallExpressionME
// ###########################################################################

export function traceCallExpressionME(state, traceCfg) {
  const newNode = buildTraceCallME(state, traceCfg);
  const { path } = traceCfg;
  path.replaceWith(newNode);

  // NOTE: `onCopy` should not be necessary anymore, since nested paths should already have finished instrumentation
  // onCopy(callee)
  // args.forEach(arg => onCopy(arg))
  // onCopy(result)
}