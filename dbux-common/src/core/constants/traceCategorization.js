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

export function hasCallId(tost) {
  return tost.callId;
}

export function isCallResult(tost) {
  return tost.resultCallId;
}