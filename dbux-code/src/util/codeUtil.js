/**
 * VSCode utilities
 */
import {
  Position, Range
} from 'vscode';
import Loc from 'dbux-common/src/core/data/Loc';


/**
 * Convert babel-style `loc` definitions to VSCode `position`
 */
export function getCodePositionFromLoc(loc: Loc): Position {
  if (loc._pos) {
    // converted this before
    return loc._pos;
  }

  // have not converted this before -> do it now
  const {
    line,
    column: character
  } = loc;
  return loc._pos = new Position(line - 1, character);
}

export function getCodeRangeFromLoc(loc: Loc): Range {
  if (loc._range) {
    // converted this before
    return loc._range;
  }

  // have not converted this before -> do it now
  const {
    start,
    end
  } = loc;

  const startPos = getCodePositionFromLoc(start);
  const endPos = getCodePositionFromLoc(end);
  return loc._range = new Range(startPos, endPos);
}