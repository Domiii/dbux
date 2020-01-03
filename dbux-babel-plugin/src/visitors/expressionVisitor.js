import * as t from '@babel/types';

// ###########################################################################
// templates + builders
// ###########################################################################

const wrapExpressionTemplate = template(`
  %%dbux%%.e(%%expressionId%%, %%expression%%)
`);

// ###########################################################################
// visitor
// ###########################################################################
export function enterExpression(path, state) {
  if (t.isIdentifier(path) || t.isLiteral(path) || t.isImport(path)) {
    // don't care about identifiers and literals (for now)
    return;
  }
  if (t.isExpressionWrapper(path)) {
    // expressionStatement, typeCastExpression, parenthesizedExpression
    return;
  }
  if ('expression' in path.node) {
    // this is just a wrapper around an actual expression (e.g. `await` or `@` (decorators))
    return;
  }

  const wrapped = wrapExpressionTemplate({

  });
  path.replaceWith(wrapped);

  // once done, also flag the wrapped thingy-deal
  state.markVisited(wrapped);
}

function enter(path, state) {
  // since we don't want collisions with other visitors, 
  //    dbuxState.onEnter will actually call `enterExpression` on any visited path before instrumentation.
  state.onEnter(path);
}


export default function expressionVisitor() {
  return {
    enter
  };
}
