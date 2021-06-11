import { buildTraceCallDefault, buildTraceCallME } from './builders/callExpressions';


// ###########################################################################
// traceCallExpressionDefault
// ###########################################################################


export function traceCallExpressionDefault(state, traceCfg) {
  const newNode = buildTraceCallDefault(state, traceCfg);
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