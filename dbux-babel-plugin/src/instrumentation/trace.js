import { buildWrapTryFinally, buildSource, buildBlock } from '../helpers/builders';
import * as t from "@babel/types";



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
export function wrapFunctionBody(bodyPath, staticId, { ids: { dbux } }) {
  const contextId = bodyPath.scope.generateUid('contextId');
  const startCalls = buildPushImmediate(contextId, dbux, staticId);
  const endCalls = buildPopImmediate(contextId, dbux);

  // wrap the function in a try/finally statement
  bodyPath.replaceWith(buildBlock([
    ...startCalls,
    buildWrapTryFinally(bodyPath.node, endCalls)
  ]));
}