/**
 * @file
 * 
 * Categorize traces based on data other than `TraceType`.
 * 
 * NOTE: Traces play complex, sometimes multiple, roles.
 * NOTE: `tost` stands for `traceOrStaticTrace`
 * 
 * ## Call expressions
 * 
 * Participants of expression statements (except for the result),
 * that is BeforeCallExpression, as well as arguments, all have a `callId`.
 * The result of a call itself could be an argument to another call, 
 * thus we link it via `resultCallId`.
*/


// ###########################################################################
// Call expressions
// ###########################################################################

export function isCallTrace(tost) {
  return tost.callId || tost.resultCallId;
}

// TODO: must do data look-up to get actual `traceType`
// export function isCallArgument(tost) {
//   return hasCallId(tost) && !isBeforeCallExpression(tost.type);
// }

/**
 * Only `BeforeCallExpression` and call argument traces have `callId`.
 */
export function hasCallId(tost) {
  return tost.callId;
}

export function isCallResult(tost) {
  return tost.resultCallId;
}