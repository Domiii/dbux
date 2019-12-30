import template from "@babel/template";
import * as t from "@babel/types";
import { getPresentableString } from '../helpers/misc';

// ###########################################################################
// builders
// ###########################################################################

/**
```
var awaitContextId;
_dbux.wrapAwait(awaitContextId, await (awaitContextId = _dbux.wrapAwaitExpression(previousContextId, someExpression())));
```
 */
const wrapAwaitTemplate = template(
  // it's pretty stupid: but babel will not let us generate an `await` partial AST outside an async function
`%%dbux%%.postAwait(
  %%awaitContextId%%, 
  %%awaitNode%%
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

  const {
    ids: { dbux }
  } = state;
  const staticId = state.addStaticContext(path, {
    type: 4, // {StaticContextType}
    displayName: getAwaitDisplayName(path)
  });
  // const schedulerIdName = getClosestContextIdName(argPath);
  const awaitContextId = path.scope.generateDeclaredUidIdentifier(
    'contextId');
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

  const newAwaitPath = path.get('arguments.1');
  state.onEnter(newAwaitPath); // make sure, we don't revisit this

  // console.log('[AWAIT]', newAwaitPath.toString());
}

export function awaitVisitor() {
  return {
    enter
  };
}
