import { buildSource } from '../helpers/builders';

/**
 * TODO: use programPath.scope.generateUid instead
 * @see https://github.com/babel/babel/tree/master/packages/babel-traverse/src/scope/index.js#L268
 */
let dbuxId = '_dbux';

function _____initDbux(dbuxId) {
  /* eslint-disable no-var */
  var _global = (function _getGlobal() {
    if (typeof window !== 'undefined') {
      _global = window;
    }
    else if (typeof global !== 'undefined') {
      _global = global;
    }
    else {
      _global = globalThis;
    }
  })();
  _global[dbuxId] = {
    thisIsDbux: true
  };
}

export function initDbux(programPath) {
  // TODO: use webpack to produce and make use of library instead
  programPath.unshiftContainer('body', buildSource(`(${_____initDbux})("${dbuxId}");`));
}

export function buildDbuxCall(source) {
  return buildSource(`${dbuxId}.${source}`)[0];
}