import isString from 'lodash/isString';
import isNumber from 'lodash/isNumber';
import isFunction from 'lodash/isFunction';
import * as t from "@babel/types";
import { Node as AstNode } from '@babel/types';
import { newLogger } from '@dbux/common/src/log/logger';

/** @typedef {import('../../definitions/TraceCfg').InputTrace} InputTrace  */

export const ZeroNode = t.numericLiteral(0);
export const NullNode = t.nullLiteral();
export const UndefinedNode = t.identifier('undefined');

/**
 * @type {InputTrace}
 */
export const ZeroInputTrace = { tidIdentifier: ZeroNode };


// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('buildUtil');

export function makeInputs(traceCfg) {
  const {
    inputTraces
  } = traceCfg;
  return inputTraces &&
    t.arrayExpression(inputTraces.map(trace => trace.tidIdentifier)) ||
    NullNode;
}

/**
 * @return {t.Identifier} 
 */
export function getTraceCall(state, traceCfg, defaultCall = 'traceExpression') {
  const { ids: { aliases } } = state;
  const traceCall = aliases[traceCfg?.meta?.traceCall || defaultCall];
  if (!traceCall) {
    throw new Error(`Invalid meta.traceCall "${traceCfg.meta.traceCall}" - Valid choices are: ${Object.keys(aliases).join(', ')}`);
  }
  return traceCall;
}

export function addMoreTraceCallArgs(args, traceCfg) {
  let moreTraceCallArgs = traceCfg?.meta?.moreTraceCallArgs;
  if (moreTraceCallArgs) {
    if (isFunction(moreTraceCallArgs)) {
      moreTraceCallArgs = moreTraceCallArgs();
    }
    if (!Array.isArray(moreTraceCallArgs)) {
      throw new Error(`moreTraceCallArgs must return array (but did not) at "${traceCfg.node?.debugTag}"`);
    }
    args.push(...moreTraceCallArgs);
  }
}


/**
 * NOTE: a variation of the input name will show up in error messages
 */
export function generateDeclaredIdentifier(path) {
  const id = path.scope.generateUidIdentifierBasedOnNode(path.node);
  path.scope.push({
    id
  });
  return id;
  // return calleePath.node.name || 'func';
}

export function buildConstObjectProperties(data) {
  return Object.entries(data)
    .map(([key, value]) => {
      let valueAst;
      // if (value instanceof AstNode) { // does not have a JS-available type
      //   valueAst = value;
      // }
      if (isString(value)) {
        valueAst = t.stringLiteral(value);
      }
      else if (isNumber(value)) {
        valueAst = t.numericLiteral(value);
      }
      else {
        // throw new Error(`cannot convert type to ObjectProperty AST: ${key}: ${value} (${typeof value})`);
        valueAst = value;
      }
      return t.objectProperty(t.stringLiteral(key), valueAst);
    });
}
