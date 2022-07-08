import TraceType from '@dbux/common/src/types/constants/TraceType';
// import { buildTraceNoValue } from './traceHelpers.old';
import { buildTraceNoValue_OLD } from './builders/misc';

export function buildContextEndTrace(path, state) {
  return buildTraceNoValue_OLD(path, state, { type: TraceType.EndOfContext });
}

/**
 * We inject `EndOfContext` at the end of any `function` and `program`
 * to allow us more accurately guess whether and where errors have.
 * Buggy: Does not work as intended. Tends to fail silently for `async` functions?
 * 
 * @deprecated Use `insertAfterBody` instead.
 */
export function injectContextEndTrace(path, state) {
  // trace `EndOfContext` at the end of program or function body
  const bodyPath = path.get('body');
  const endOfContext = buildContextEndTrace(path, state);

  // console.debug('[injectContextEndTrace]', astNodeToString(endOfContext));

  // hackfix: babel seems to force us to handle array and non-array separately
  if (Array.isArray(bodyPath.node)) {
    bodyPath.insertAfter(endOfContext);
  }
  else
  {
    path.pushContainer('body', endOfContext);
  }
}
