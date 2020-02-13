import * as t from '@babel/types';
import { NodePath } from '@babel/core';
import { isDebug } from 'dbux-common/src/util/nodeUtil';
import { logInternalWarning } from '../log/logger';
import { getAllClassParents, getClassAncestryString } from './astHelpers';
import { getPresentableString, toSourceStringWithoutComments } from './misc';
import { getMemberExpressionName } from './objectHelpers';

// ###########################################################################
// function names
// ###########################################################################

export function functionNoName(functionPath) {
  // return `(${getPresentableString(functionPath.toString(), 30)})`;
  return '(anonymous)';
}

function getCallbackDisplayName(functionPath) {
  const { parentPath } = functionPath;
  const calleePath = parentPath.get('callee') || parentPath.parentPath?.get('callee');
  if (calleePath) {
    /**
     * 9. anonymous callback argument - f(() => {}) - `t.isCallExpression(p)`
     */
    // const callName = getMemberExpressionName(calleePath);
    const callName = toSourceStringWithoutComments(calleePath.node);
    return `[cb] ${callName}`;
  }
  return null;
}

export function getFunctionDisplayName(functionPath, functionName) {
  if (!functionName) {
    functionName = guessFunctionName(functionPath);
    if (!functionName) {
      // anonymous callback arguments get special treatment
      const callbackName = getCallbackDisplayName(functionPath);
      if (callbackName) {
        return callbackName;
      }
    }
  }

  let displayName = functionName && functionName || functionNoName(functionPath);

  // function methods
  // if (t.isClassMethod(functionPath) || t.isClassProperty(functionPath.parentPath)) {
  const ancestry = getClassAncestryString(functionPath);
  if (ancestry) {
    displayName = `${ancestry}.${displayName}`;
  }
  // }
  return displayName;
}

/**
 * 
 */
export function guessFunctionName(functionPath: NodePath) {
  if (isDebug()) {
    // basic sanity checks
    if (!t.isFunction(functionPath)) {
      throw new Error('invalid path must be function: ' + functionPath.node.type);
    }
  }
  const { node } = functionPath;

  /**
   * 1. Named function: `function f() {}`
   * 2. Named class method: `class A { f() {} }`
   * 3.  Named object method: `const o = { f() {} }`
   */
  let name = node.id?.name || node.key?.name;

  if (!name) {
    const { parentPath } = functionPath;
    const parent = parentPath.node;
    // const parentDebugString = toSourceStringWithoutComments(parent);  // very helpful for debugging!
    if (parent.id) {
      /**
       * 4. Variable declaration: `const f = () => {}`
       */
      name = parent.id.name;
    }
    else if (parent.key) {
      /**
       * 5. Object property: `({ f: () => {} })`
       * 6. Class member: `class A { f = () => {} }`
       */
      name = parent.key.name;
    }
    else if (parent.left) {
      const leftPath: NodePath = parentPath.get('left');
      const { left } = parent;
      if (left.name) {
        /**
         * 7. local variable assignment: `f = () => {}`
         */
        name = left.name;
      }
      else if (leftPath.isMemberExpression()) {
        /**
         * 8. this assignment: `this.f = () => {}`
         */
        name = getMemberExpressionName(leftPath, false);
      }
    }
  }
  return name;
}