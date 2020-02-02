import template from "@babel/template";
import * as t from "@babel/types";
import { getPresentableString } from '../helpers/misc';
import TraceType from 'dbux-common/src/core/constants/TraceType';
import StaticContextType from '../../../dbux-common/src/core/constants/StaticContextType';

// ###########################################################################
// builders
// ###########################################################################

const wrapAwaitTemplate = template(
  // WARNING: id must be passed AFTER awaitNode, 
  //    because else it will be undefined.
  //    The value will be bound before `await` and thus before `preAwait` was called.
`%%dbux%%.postAwait(
  %%awaitNode%%,
  %%awaitContextId%%,
  %%postTraceId%%
)
`);

const wrapAwaitExpressionTemplate = template(`
(%%dbux%%.wrapAwait(%%awaitContextId%% = %%dbux%%.preAwait(%%staticId%%, %%preTraceId%%), %%argument%%))
`);


function getAwaitDisplayName(path) {
  const MaxLen = 30;
  return `(${getPresentableString(path.toString(), MaxLen)})`;
}

// ###########################################################################
// visitor
// ###########################################################################

function addResumeContext(awaitPath, state) {
  const { loc: awaitLoc } = awaitPath.node;
  
  // the "resume context" starts after the await statement
  const locStart = awaitLoc.end;
  return state.addResumeContext(awaitPath, locStart);
}

function enter(path, state) {
  if (!state.onEnter(path, 'context')) return;

  // console.log('[AWAIT]', path.toString());

  const {
    ids: { dbux }
  } = state;

  const resumeId = addResumeContext(path, state);
  const staticId = state.addStaticContext(path, {
    type: StaticContextType.AwaitExpression,
    displayName: getAwaitDisplayName(path),
    resumeId
  });

  // const schedulerIdName = getClosestContextIdName(argPath);
  const awaitContextId = path.scope.generateDeclaredUidIdentifier('contextId');
  const argumentPath = path.get('argument');
  const argument = argumentPath.node;

  const preTraceId = state.addTrace(argumentPath, TraceType.Await, true);
  const postTraceId = state.addTrace(path, TraceType.Resume, true);

  const expressionReplacement = wrapAwaitExpressionTemplate({
    dbux,
    staticId: t.numericLiteral(staticId),
    awaitContextId,
    preTraceId: t.numericLiteral(preTraceId),
    argument
  });
  argumentPath.replaceWith(expressionReplacement);

  const awaitReplacement = wrapAwaitTemplate({
    dbux,
    awaitNode: path.node,
    awaitContextId,
    postTraceId: t.numericLiteral(postTraceId)
  });
  path.replaceWith(awaitReplacement);

  // prevent infinite loop
  const newAwaitPath = path.get('arguments.0');
  state.onCopy(path, newAwaitPath, 'context');

}

export default function awaitVisitor() {
  return {
    enter
  };
}
