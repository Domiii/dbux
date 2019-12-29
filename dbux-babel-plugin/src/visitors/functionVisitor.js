import { guessFunctionName, getFunctionDisplayName } from '../helpers/functionHelpers';
import { buildWrapTryFinally, buildSource, buildBlock } from '../helpers/builders';
import * as t from "@babel/types";

// ###########################################################################
// Modification
// ###########################################################################

// export function instrumentAwaitEventStream(bodyPath) {
//   // TODO: https://babeljs.io/docs/en/babel-types#forofstatement -- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of
//   //
// }

function buildPushImmediate(contextId, dbux, staticId) {
  return buildSource(`const ${contextId} = ${dbux}.pushImmediate(${staticId});`);
}

function buildPopImmediate(contextId, dbux) {
  return buildSource(`${dbux}.popImmediate(${contextId});`);
}

/**
 * Instrument all Functions and Program to keep track of all (possibly async) execution stacks.
 */
export function wrapFunctionBody(bodyPath, staticId, { ids: { dbux }, genContextIdName }) {
  const contextIdName = genContextIdName(bodyPath);
  const startCalls = buildPushImmediate(contextIdName, dbux, staticId);
  const endCalls = buildPopImmediate(contextIdName, dbux);

  let body = bodyPath.node;
  if (!Array.isArray(bodyPath.node) && !t.isStatement(bodyPath.node)) {
    // simple lambda expression -> convert to block lambda expression with return statement
    body = t.blockStatement([t.returnStatement(bodyPath.node)]);
  }

  // wrap the function in a try/finally statement
  bodyPath.replaceWith(buildBlock([
    ...startCalls,
    buildWrapTryFinally(body, endCalls)
  ]));
}

// ###########################################################################
// visitor
// ###########################################################################

export default function functionVisitor() {
  return {
    enter(path, state) {
      if (!state.onEnter(path)) return;
      // console.warn('F', path.toString());

      const name = guessFunctionName(path);
      const displayName = getFunctionDisplayName(path);

      const staticContextData = {
        type: 2, // {StaticContextType}
        name,
        displayName
      };
      const staticId = state.addStaticContext(path, staticContextData);
      const bodyPath = path.get('body');

      wrapFunctionBody(bodyPath, staticId, state);

      if (path.node.generator) {
        // TOOD: special treatment for generator functions
      }
    }
  }
}