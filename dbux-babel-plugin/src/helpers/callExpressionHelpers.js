import * as t from '@babel/types';
import { isDebug } from 'dbux-common/src/util/nodeUtil';
import { logInternalWarning } from '../log/logger';


// ###########################################################################
// function calls
// ###########################################################################

const KnownCallbackSchedulingFunctionNames = [
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
];

export function getCallFunctionName(callPath) {
  const { callee } = callPath;

  if (t.isMemberExpression(callee)) {

  }
  else if (t.isIdentifier(callee)) {

  }

}