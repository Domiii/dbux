import * as t from '@babel/types';
import { isDebug } from 'dbux-common/src/util/nodeUtil';
import { logInternalWarning } from '../log/logger';
import { getAllClassParents } from './astGetters';
import { getPresentableString } from './misc';

// ###########################################################################
// function names
// ###########################################################################

export function functionNoName(functionPath) {
  // return `(${getPresentableString(functionPath.toString(), 30)})`;
  return '(anonymous)';
}

export function getFunctionDisplayName(functionPath, functionName) {
  if (!functionName) {
    functionName = guessFunctionName(functionPath);
  }

  let displayName = functionName && functionName || functionNoName(functionPath);

  // function methods
  if (t.isClassMethod(functionPath) || t.isClassProperty(functionPath.parentPath)) {
    const classParents = getAllClassParents(functionPath);
    if (classParents.length) {
      displayName = classParents.map(p => p.node.id.name).join('.') + '.' + displayName;
    }
  }
  return displayName;
}

/**
 * TODO: this.getLocalStorage = () => {
 */
export function guessFunctionName(functionPath) {
  if (isDebug()) {
    // basic sanity checks
    if (!t.isFunction(functionPath)) {
      throw new Error('invalid path must be function: ' + functionPath.node.type);
    }
  }
  const { node } = functionPath;
  let name = node.key ? node.key.name : node.id?.name;
  if (!name) {
    /**
     * handle (at least) three cases of anonymous functions:
     * 1. Variable `const f = () => {};`
     * 2. Object property `({ f: () => {} })`
     * 3. Class member `class A { f = () => {} }`
     */
    const p = functionPath.parentPath.node;
    name = p.id?.name || p.key?.name;

    if (!name) {
      // TODO: t.isCallExpression(p)
      // logInternalWarning('Could not guess name of function: ', functionPath.toString());
      // debugger;
    }
  }
  return name;
}