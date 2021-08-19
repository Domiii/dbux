import * as t from "@babel/types";
import { newLogger } from '@dbux/common/src/log/logger';
import { pathToString } from './pathHelpers';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('traceUtil');

export const ZeroNode = t.numericLiteral(0);

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