import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { newLogger } from '@dbux/common/src/log/logger';
import { astNodeToString } from '../../helpers/pathHelpers';
import { pathToString } from '../../helpers/pathHelpers';
import { makeInputs } from './buildUtil';
import { buildTraceId } from './misc';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('builders/objects');



export function convertNonComputedPropToStringLiteral(prop, computed) {
  if (!computed) {
    let propName;
    if (!t.isIdentifier(prop)) {
      // NOTE: should never happen
      throw new Error(`property was not computed and NOT identifier: ${astNodeToString(prop)}`);
    }
    else {
      propName = prop.name;
    }
    // NOTE: `o.x` becomes `tme(..., 'x', ...)`
    //      -> convert `Identifier` to `StringLiteral`
    prop = t.stringLiteral(propName);
  }
  return prop;
}

// // eslint-disable-next-line no-unused-vars
// const { log, debug, warn, error: logError } = newLogger('builders/objects');

/**
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