import * as t from 'babel-types';

export function callDbuxMethod(state, methodName, ...args) {
  const {
    ids: { dbux }
  } = state;

  t.callExpression(t.memberExpression(dbux, t.identifier(methodName)), args);
}