import isFunction from 'lodash/isFunction';
import * as t from "@babel/types";
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

export function getTraceCall(state, traceCfg, defaultCall = 'traceExpression') {
  const { ids: { aliases } } = state;
  const trace = aliases[traceCfg?.meta?.traceCall || defaultCall];
  if (!trace) {
    throw new Error(`Invalid meta.traceCall "${traceCfg.meta.traceCall}" - Valid choices are: ${Object.keys(aliases).join(', ')}`);
  }
  return trace;
}

export function addMoreTraceCallArgs(args, traceCfg) {
  let moreTraceCallArgs = traceCfg?.meta?.moreTraceCallArgs;
  if (moreTraceCallArgs) {
    if (isFunction(moreTraceCallArgs)) {
      moreTraceCallArgs = moreTraceCallArgs();
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