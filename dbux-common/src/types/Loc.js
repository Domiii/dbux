/**
 * @file future-work: use Babel's own types instead.
 */

/**
 * NOTE: Babel does not name their `position`, so we name it `LocPos`
 */
export class LocPos {
  line;
  column;
}

/**
 * All Babel nodes have a `start` and `end` property, indicating the absolute position in the string representation of the source code.
 * We call that `Loc1D`.
 */
export class Loc1D {
  /**
   * @type {number}
   */
  start;

  /**
   * @type {number}
   */
  end;
}

/**
 * NOTE: `loc` is short for 'SourceLocation`
 * @see https://github.com/babel/babel/tree/master/packages/babel-types/scripts/generators/flow.js#L27
 */
export default class Loc {
  /**
   * @type {LocPos}
   */
  start;

  /**
   * @type {LocPos}
   */
  end;
}