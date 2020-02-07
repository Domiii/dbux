/**
 * NOTE: `loc` is short for 'SourceLocation`
 * @see https://github.com/babel/babel/tree/master/packages/babel-types/scripts/generators/flow.js#L27
 */
export default class Loc {
  start: {
    line: number,
    column: number,
  };

  end: {
    line: number,
    column: number
  };
}