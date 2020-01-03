import template from "@babel/template";
import * as t from "@babel/types";
import { getPresentableString } from '../helpers/misc';

// ###########################################################################
// builders
// ###########################################################################

const wrapAwaitTemplate = template(
  // WARNING: id must be passed AFTER awaitNode, because else it will be undefined (the value will be bound before `await` statement and thus before `awaitId` was called)
`%%dbux%%.postAwait(
  %%awaitNode%%,
  %%awaitContextId%%
)
`);

const wrapAwaitExpressionTemplate = template(`
(%%dbux%%.wrapAwait(%%awaitContextId%% = %%dbux%%.awaitId(%%staticId%%), %%argument%%))
`);


function getAwaitDisplayName(path) {
  const MaxLen = 30;
  return `(${getPresentableString(path.toString(), MaxLen)})`;
}

// ###########################################################################
// visitor
// ###########################################################################

function enter(path, state) {
  if (!state.onEnter(path)) return;

  // console.log('[AWAIT]', path.toString());

  const {
    ids: { dbux }
  } = state;
  const staticId = state.addStaticContext(path, {
    type: 4, // {StaticContextType}
    displayName: getAwaitDisplayName(path)
  });
  // const schedulerIdName = getClosestContextIdName(argPath);
  const awaitContextId = path.scope.generateDeclaredUidIdentifier('contextId');
  const argumentPath = path.get('argument');
  const argument = argumentPath.node;

  const expressionReplacement = wrapAwaitExpressionTemplate({
    dbux,
    staticId: t.numericLiteral(staticId),
    awaitContextId,
    argument
  });
  argumentPath.replaceWith(expressionReplacement);

  const awaitReplacement = wrapAwaitTemplate({
    dbux,
    awaitNode: path.node,
    awaitContextId
  });
  path.replaceWith(awaitReplacement);

  const newAwaitPath = path.get('arguments.0');
  state.onEnter(newAwaitPath); // prevent infinite loop: make sure, we don't revisit this

}

export default function awaitVisitor() {
  return {
    enter
  };
}
