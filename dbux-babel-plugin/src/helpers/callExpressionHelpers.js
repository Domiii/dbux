import * as t from '@babel/types';
import { isDebug } from 'dbux-common/src/util/nodeUtil';
import { logInternalWarning } from '../log/logger';
import { getRightMostIdOfMember } from './objectHelpers';
import { call } from '../../dist/index';


// ###########################################################################
// function calls
// ###########################################################################

const KnownCallbackSchedulingFunctionNames = new Set([
  // basic JS stuff
  'setTimeout',
  'setInterval',
  'setIntermediate',

  // promises
  // (there can be quite a few more - @see http://bluebirdjs.com/docs/api-reference.html)
  'then',
  'catch',
  'finally',
  'error',

  // node process
  'next'
]);

export function getCalleeId(callPath) {
  const { callee } = callPath.node;
  let id;
  if (t.isIdentifier(callee)) {
    id = callee;
  }
  else if (t.isMemberExpression(callee)) {
    id = getRightMostIdOfMember(callee);
  }
  return id;
}

export function isKnownCallbackSchedulingCall(callPath) {
  const id = getCalleeId(callPath);
  if (id) {
    return KnownCallbackSchedulingFunctionNames.has(id.name);
  }
  return false;
}