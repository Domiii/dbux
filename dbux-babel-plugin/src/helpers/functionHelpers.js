import * as t from '@babel/types';
import { isDebug } from '@dbux/common/src/util/nodeUtil';
import { newLogger } from '@dbux/common/src/log/logger';
import { getClassAncestryString } from './traversalHelpers';
import { getMemberExpressionName } from './objectHelpers';
import { extractSourceStringWithoutComments } from './sourceHelpers';
import { isNodeInstrumented } from './instrumentationHelper';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('dbux-code');

// ###########################################################################
// function names
// ###########################################################################

export function isCallPath(path) {
  return path.isCallExpression() || path.isOptionalCallExpression() || path.isNewExpression();
}

export function functionNoName() {
  // return `(${getPresentableString(functionPath.toString(), 30)})`;
  return '(anonymous)';
}

function getCallbackDisplayName(functionPath, state) {
  const { parentPath } = functionPath;
  const calleePath = parentPath.get('callee') || parentPath.parentPath?.get('callee');

  if (calleePath?.node) {
    /**
     * 9. anonymous callback argument - f(() => {}) - `t.isCallExpression(p)`
     */
    // const callName = getMemberExpressionName(calleePath);
    let callName;
    if (!isNodeInstrumented(calleePath.node)) {
      // not instrumented before -> we can extract source code
      callName = extractSourceStringWithoutComments(calleePath.node, state);
    }
    else {
      // callee has already been instrumented -> get name from trace (if possible)
      const trace = state.traces.getTraceOfPath(calleePath);
      if (trace) {
        callName = trace.displayName;
      }
      else {
        // callName = '(unnamed)';
        warn('could not extract name of callback\'s callee:', functionPath.parentPath.toString());
        return null;
      }
    }
    return `[cb] ${callName}`;
  }
  return null;
}

export function getFunctionDisplayName(functionPath, state, functionName) {
  if (!functionName) {
    functionName = guessFunctionName(functionPath, state);
    if (!functionName) {
      // anonymous callback arguments get special treatment
      const callbackName = getCallbackDisplayName(functionPath, state);
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
 * @param {NodePath}
 */
export function guessFunctionName(functionPath, state) {
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
      const leftPath = parentPath.get('left');
      const { left } = parent;
      if (left.name) {
        /**
         * 7. local variable assignment: `f = () => {}`
         */
        name = left.name;
      }
      else if (leftPath.isMemberExpression()) {
        /**
         * 8. object assignment: `o.f = () => {}`
         */
        name = getMemberExpressionName(leftPath, state, false);
      }
    }
  }
  return name;
}