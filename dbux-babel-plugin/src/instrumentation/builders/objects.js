import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { newLogger } from '@dbux/common/src/log/logger';
import { astNodeToString, pathToString } from '../../helpers/pathHelpers';
import { makeInputs } from './buildUtil';
import { buildTraceId } from './traceId';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('builders/objects');



export function convertNonComputedPropToStringLiteral(keyAstNode, computed) {
  if (!computed && !t.isLiteral(keyAstNode)) {
    // NOTE: ME can be `Identifier` or `PrivateName` (https://babeljs.io/docs/en/babel-types#privatename)
    // NOTE2: official babel documentation is incorrect (as of 7/2021) - https://babeljs.io/docs/en/babel-types.html#memberexpression
    //        -> "property: if computed then Expression else Identifier (required)"
    //        -> official specs do mention `PrivateIdentifier` - https://tc39.es/ecma262/#prod-MemberExpression
    let propName = t.isPrivateName(keyAstNode) ? 
      `#${keyAstNode.id.name}` :
      keyAstNode.name;
    // NOTE: `o.x` becomes `tme(..., 'x', ...)`
    //      -> convert `Identifier` to `StringLiteral`
    if (!propName) {
      throw new Error(`Given AST node does not have a "name" property: ${JSON.stringify(keyAstNode)}`);
    }
    keyAstNode = t.stringLiteral(propName);
  }
  return keyAstNode;
}

// // eslint-disable-next-line no-unused-vars
// const { log, debug, warn, error: logError } = newLogger('builders/objects');

/**
 * Convert object properties to entry array (e.g. [['key', value], [computedKey2, value2]])
 * 
 * @param {NodePath[]} propPaths 
 */
function buildObjectEntries(propPaths) {
  return t.arrayExpression(
    propPaths.map(propPath => {
      const isSpread = propPath.isSpreadElement();
      if (!isSpread && !propPath.isObjectProperty()) {
        // NOTE: everything should have been converted to `ObjectProperty`.
        // NOTE2: We don't really have a comprehensive way to recover from here -> throw!
        throw new Error(`Unexpected non-ObjectProperty in ObjectExpression: ${pathToString(propPath)} in ${pathToString(propPath.parentPath)}`);
      }
      const { node: astNode } = propPath;
      if (isSpread) {
        return astNode.argument;
      }
      return t.arrayExpression([
        convertNonComputedPropToStringLiteral(astNode.key, astNode.computed),
        astNode.value
      ]);
    })
  );
}

export function buildObjectExpression(state, traceCfg) {
  const { ids: { aliases: { traceObjectExpression } } } = state;
  const tid = buildTraceId(state, traceCfg);

  const {
    path
  } = traceCfg;

  const propPaths = path.get('properties');

  return t.callExpression(
    traceObjectExpression,
    [
      buildObjectEntries(propPaths),
      tid,
      makeInputs(traceCfg)
    ]
  );
}