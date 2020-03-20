import * as t from '@babel/types';
import { extractSourceStringWithoutComments } from './sourceHelpers';

export function callDbuxMethod(state, methodName, ...args) {
  const {
    ids: { dbux }
  } = state;

  t.callExpression(t.memberExpression(dbux, t.identifier(methodName)), args);
}

export function getCalleeName(state, callPath) {
  const callee = callPath.get('callee');
  return extractSourceStringWithoutComments(callee.node, state);
}