import isFunction from 'lodash/isFunction';
import * as t from "@babel/types";
import { newLogger } from '@dbux/common/src/log/logger';
import { pathToString } from '../../helpers/pathHelpers';

export const ZeroNode = t.numericLiteral(0);
export const NullNode = t.nullLiteral();
export const UndefinedNode = t.identifier('undefined');


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

export function getDeclarationTid(traceCfg) {
  const {
    isDeclaration
  } = traceCfg;

  // look-up declaration tid
  // NOTE: in case this is a declaration, it might not have a `bindingTrace`
  let declarationTid = traceCfg.node?.getDeclarationTidIdentifier();

  if (!declarationTid && isDeclaration) {
    declarationTid = traceCfg.tidIdentifier;
  }

  // const declNode = traceCfg.node?.getDeclarationNode();
  // const { path } = traceCfg;
  // // eslint-disable-next-line max-len
  // console.warn(`getDeclarationTid: ${pathToString(traceCfg.path, true)}, ${declarationTid.name}, ${path.listKey || path.parentPath.node.type}, decl=${pathToString(declNode.path, true)}`);

  if (!declarationTid) {
    const declNode = traceCfg.node?.getDeclarationNode();
    warn(`getDeclarationTid returned nothing for traceCfg at "${traceCfg.node || pathToString(traceCfg.path)}", declNode="${declNode}"`);
  }
  return declarationTid || ZeroNode;
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