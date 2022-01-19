import isString from 'lodash/isString';

/**
 * @see https://microsoft.github.io/PowerBI-JavaScript/interfaces/_node_modules__types_node_globals_d_.nodejs.callsite.html
 * @see https://github.com/dougwilson/nodejs-depd/blob/master/index.js#L267
 */
function callSite2String(callSite) {
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


// eslint-disable-next-line no-inner-declarations
export function err2String(err) {
  if (Array.isArray(err?.stack)) {
    /**
     * stack is array of `CallSite`
     */
    return `${err.message}\n    ${err.stack.map(callSite2String).join('\n    ')}`;
  }
  return isString(err?.stack) && err.stack.includes(err.message) ? err.stack : err.toString();
}