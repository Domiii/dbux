import isString from 'lodash/isString';

/**
 * The default for Error.toString is to simply return `Error.message`.
 * That is terrible. This gets a stack instead.
 * 
 * NOTE: Error.stack might be array of `CallSite`.
 * NOTE2: This is just a few heuristics, since the stack trace can be customized arbitrarily.
 * This is usually provided from the `Error.prepareStackTrace` hook.
 * @see https://v8.dev/docs/stack-trace-api#customizing-stack-traces
 */
export function err2String(err) {
  if (Array.isArray(err?.stack)) {
    /**
     * Stack is array of `CallSite`.
     */
    return `${err.message}\n    ${err.stack.map(callSite2String).join('\n    ')}`;
  }
  return isString(err?.stack) && err.stack.includes(err.message) ?
    err.stack :
    err.toString();
}

/**
 * @param {CallSite}
 * 
 * @see https://v8.dev/docs/stack-trace-api#customizing-stack-traces
 * @see https://microsoft.github.io/PowerBI-JavaScript/interfaces/_node_modules__types_node_globals_d_.nodejs.callsite.html
 * @see https://github.com/dougwilson/nodejs-depd/blob/master/index.js#L267
 */
export function callSite2String(callSite) {
  let file = callSite.getFileName() || '<anonymous>';
  const line = callSite.getLineNumber();
  const col = callSite.getColumnNumber();

  if (callSite.isEval()) {
    file = callSite.getEvalOrigin() + ', ' + file;
  }

  // site.callSite = callSite;
  const fname = callSite.getFunctionName();

  return `at ${fname} (${file}:${line}:${col})`;
}
