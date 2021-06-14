import EmptyArray from '@dbux/common/src/util/EmptyArray';


function makeSpreadableArgumentCfg(argPath) {
  return {
    isSpread: argPath.isSpreadElement()
  };
}

/**
 * Takes a an array of arguments to indicate which are `SpreadElement` and which not.
 * 
 * NOTE: This is used by `CallExpression`, `ArrayExpression`.
 */
export function makeSpreadableArgumentArrayCfg(argumentPaths) {
  return argumentPaths?.map(makeSpreadableArgumentCfg) || EmptyArray;
}

/**
 * Takes a an array of arguments to indicate which are `SpreadElement` and which not.
 * 
 * NOTE: This is used by `ObjectExpression`.
 */
export function makeSpreadableArgumentObjectCfg(propertyPaths) {
  return propertyPaths?.map((propPath) => ({ 
    key: propPath.node.key,
    isSpread: propPath.isSpreadElement()
  })) || EmptyArray;
}
