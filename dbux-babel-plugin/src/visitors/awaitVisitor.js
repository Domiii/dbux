import template from "@babel/template";
import * as t from "@babel/types";
import TraceType from '@dbux/common/src/core/constants/TraceType';
import StaticContextType from '@dbux/common/src/core/constants/StaticContextType';
import { getPresentableString } from '../helpers/misc';
import { isPathInstrumented } from '../helpers/astUtil';
import { traceWrapExpressionStatement } from '../helpers/traceHelpers';

// ###########################################################################
// builders
// ###########################################################################

const postAwaitTemplate = template(
  // WARNING: id must be passed AFTER awaitNode, 
  //    because else it will be undefined.
  //    The value will be bound before `await` and thus before `preAwait` was called.
  `%%dbux%%.postAwait(
  %%awaitNode%%,
  %%awaitContextId%%,
  %%resumeTraceId%%
)
`);

const wrapAwaitExpressionTemplate = template(`
(%%dbux%%.wrapAwait(%%argument%%, %%awaitContextId%% = %%dbux%%.preAwait(%%staticId%%, %%preTraceId%%)))
`);


function getAwaitDisplayName(path) {
  return `(${getPresentableString(path.toString())})`;
}

// ###########################################################################
// visitor
// ###########################################################################

function addResumeContext(awaitPath, state) {
  const { loc: awaitLoc } = awaitPath.node;

  // the "resume context" starts after the await statement
  const locStart = awaitLoc.end;
  return state.contexts.addResumeContext(awaitPath, locStart);
}

export function awaitVisitEnter(path, state) {
  // // eslint-disable-next-line max-len
  // throw new Error('`await` keyword detected while instrumenting program. The Dbux team is still working on making `await` work, however it is not working yet. Please see https://github.com/Domiii/dbux/issues/128 for more info.');
  if (!state.onEnter(path, 'context')) return;

  // console.log('[AWAIT]', path.toString());

  const {
    ids: { dbux }
  } = state;

  const resumeId = addResumeContext(path, state);
  const staticId = state.contexts.addStaticContext(path, {
    type: StaticContextType.Await,
    displayName: getAwaitDisplayName(path),
    resumeId
  });

  const awaitContextId = path.scope.generateDeclaredUidIdentifier('contextId');
  const argumentPath = path.get('argument');
  const argument = argumentPath.node;

  // TODO: trace-type
  const preTraceId = state.traces.addTrace(argumentPath, TraceType.Await, true);
  const resumeTraceId = state.traces.addTrace(path, TraceType.Resume, true);

  const expressionReplacement = wrapAwaitExpressionTemplate({
    dbux,
    staticId: t.numericLiteral(staticId),
    awaitContextId,
    preTraceId: t.numericLiteral(preTraceId),
    argument
  });
  argumentPath.replaceWith(expressionReplacement);

  const awaitReplacement = postAwaitTemplate({
    dbux,
    awaitNode: path.node,
    awaitContextId,
    resumeTraceId: t.numericLiteral(resumeTraceId)
  });
  path.replaceWith(awaitReplacement);

  // prevent infinite loop
  const newAwaitPath = path.get('arguments.0');
  state.onCopy(path, newAwaitPath, 'context');
}

/**
 * Assumption: `path` has already been instrumented with `wrapAwait`.
 */
export function awaitVisitExit(path, state) {
  // console.warn('[awaitVisitExit]', path/* .get('argument') */.toString());
  let targetPath = path.get('argument').get('arguments')[0];
  if (!isPathInstrumented(targetPath)) {
    const replacement = traceWrapExpressionStatement(TraceType.ExpressionValue, targetPath, state, null);
    targetPath.replaceWith(replacement);
  }
}

export default function awaitVisitor() {
  return {
    enter: awaitVisitEnter
  };
}
