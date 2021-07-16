import isNumber from 'lodash/isNumber';

/** @typedef {import('@dbux/common/src/types/Loc').LocPos} LocPos */
/** @typedef {import('@dbux/common/src/types/Loc').Loc1D} Loc1D */

/**
 * @param {LocPos} a 
 * @param {LocPos} b 
 */
function locPosIsBehind(a, b) {
  return b.line > a.line || (b.line === a.line && b.column >= a.column);
}

export function isInLoc(inner, outer) {
  return locPosIsBehind(outer.start, inner.start) &&
    locPosIsBehind(inner.end, outer.end);
}

/**
 * @param {Loc1D} inner 
 * @param {Loc1D} outer
 */
export function isInLoc1D(inner, outer) {
  if (!isNumber(inner.start) || !isNumber(outer.start)) {
    throw new Error('Invalid Loc1D: inner and outer both must be Loc1D');
  }
  return inner.start >= outer.start && inner.end <= outer.end;
}

/**
 * Create new `Loc` that ranges from the beginning of `path` to beginning of its body.
 */
export function getPreBodyLoc(path) {
  let bodyPath = path.get('body');
  if (!path.node.body) {
    throw new Error('path does not have body:' + path.toString());
  }
  bodyPath = Array.isArray(bodyPath) ? bodyPath[0] : bodyPath;

  const { start } = path.node.loc;
  const end = bodyPath.node.loc.start;
  return {
    start,
    end
  };
}

/**
 * Create new `Loc1D` that ranges from the beginning of `path` to beginning of its body.
 */
export function getPreBodyLoc1D(path) {
  let bodyPath = path.get('body');
  bodyPath = Array.isArray(bodyPath) ? bodyPath[0] : bodyPath;

  const { start } = path.node;
  const end = (bodyPath?.node.start || path.node.start || (start + 1)) - 1;
  return {
    start,
    end
  };
}

export function locToString(loc) {
  return `${loc.start.line}:${loc.start.column}`;
}