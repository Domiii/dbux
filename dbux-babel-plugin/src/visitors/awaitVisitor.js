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
const wrapAwaitTemplate = template(`
%%dbux%%.pushAwait(%%staticId%%, %%awaitContextId%%, await (%%awaitContextId%% = %%dbux%%.popAwait(%%previousContextId%%, %%expression%%)));
`);


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
  const awaitContextId = path.scope.generateDeclaredUidIdentifier('awaitContextId');
  const expression = path.get('expression').node;

  return wrapAwaitTemplate({
    dbux,
    staticId,
    awaitContextId,
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

export function callExpressionVisitor() {
  return {
    enter
  };
}
