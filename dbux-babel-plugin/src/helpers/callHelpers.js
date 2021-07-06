import { extractSourceStringWithoutComments } from './sourceHelpers';



// export function buildCallExpression() {

// }

/**
 * @deprecated
 */
export function getCalleeName(state, callPath) {
  const callee = callPath.get('callee');
  return extractSourceStringWithoutComments(callee.node, state);
}