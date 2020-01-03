import * as t from '@babel/types';
import template from '@babel/template';

// ###########################################################################
// templates + builders
// ###########################################################################

const wrapExpressionTemplate = template(`
  %%dbux%%.e(%%expression%%, %%expressionId%%)
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

  const expressionId = state.addExpression(path);
  const { ids: { dbux } } = state;
  const wrapped = wrapExpressionTemplate({
    dbux,
    expression: path.node,
    expressionId: t.numericLiteral(expressionId)
  });
  path.replaceWith(wrapped);

  // // prevent infinite loop
  // const newPath = path.get('arguments.0');
  // state.markVisited(newPath);
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
