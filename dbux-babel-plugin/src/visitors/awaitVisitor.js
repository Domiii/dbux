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
`%%dbux%%.resume(
  %%staticId%%, 
  %%awaitContextId%%, 
  (async () => await (
    %%awaitContextId%% = %%dbux%%.interrupt(%%expression%%)
  ))()
)`
);


function getAwaitDisplayName(path) {
  const MaxLen = 30;
  return `(${getPresentableString(path.toString(), MaxLen)})`;
}

function buildWrapAwait(path, state) {
  const {
    ids: { dbux }
  } = state;
  const staticId = state.addStaticContext(path, {
    type: 4, // {StaticContextType}
    displayName: getAwaitDisplayName(path)
  });
  // const schedulerIdName = getClosestContextIdName(argPath);
  const awaitContextIdId = path.scope.generateDeclaredUidIdentifier('awaitContextId');
  const expression = path.get('expression').node;

  return wrapAwaitTemplate({
    dbux,
    staticId: t.numericLiteral(staticId),
    awaitContextId: awaitContextIdId,
    expression,
  });
}

// ###########################################################################
// visitor
// ###########################################################################

function enter(path, state) {
  if (!state.onEnter(path)) return;

  console.log('[AWAIT]', path.toString());

  path.replaceWith(buildWrapAwait(path, state));
}

export function awaitVisitor() {
  return {
    enter
  };
}
