/**
 * VSCode range/position <-> Babel SourceLocation helpers.
 * NOTE: Babel does not name their `position`; and `loc` is short for 'SourceLocation`
 * 
 * @see https://github.com/babel/babel/tree/master/packages/babel-types/scripts/generators/flow.js#L27
 * @file
 */

import {
  Position, Range
} from 'vscode';

/** @typedef {import('@dbux/common/src/core/data/Loc').default} Loc */
/** @typedef {import('@dbux/common/src/core/data/Loc').LocPos} LocPos */

/**
 * VSCode's `Position` is slightly different from Babel's `start` and `end` in `SourceLocation`.
 * VSCode lines start at 0, Babel's start at 1.
 */
export function codeLineToBabelLine(codeLine) {
  return codeLine + 1;
}

export function babelLineToCodeLine(babelLine) {
  return babelLine - 1;
}

/**
 * @param {Position} pos 
 * @return {LocPos}
 */
export function codePositionToBabelPosition(pos) {
  const { line, character } = pos;
  return {
    line: codeLineToBabelLine(line),
    column: character
  };
}

/**
 * Convert babel-style `loc` position definitions to VSCode `position`
 * @param {LocPos} loc
 * @return {Position}
 */
export function babelLocToCodePosition(loc) {
  if (loc._pos) {
    // converted this before
    return loc._pos;
  }

  // have not converted this before -> do it now
  const {
    line,
    column: character
  } = loc;
  return loc._pos = new Position(babelLineToCodeLine(line), character);
}

/**
 * @param {Loc} loc 
 * @return {Range}
 */
export function babelLocToCodeRange(loc) {
  if (loc._range) {
    // converted this before
    return loc._range;
  }

  // have not converted this before -> do it now
  const {
    start,
    end
  } = loc;

  const startPos = babelLocToCodePosition(start);
  const endPos = babelLocToCodePosition(end);
  return loc._range = new Range(startPos, endPos);
}