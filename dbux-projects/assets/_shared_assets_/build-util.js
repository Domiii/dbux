
/**
 * Gets the line at given offset in s, as well as `nLines` lines below and above.
 */
export function getLinesAroundOffset(s, offset, nLines = 1, maxChars = 50) {
  let start = offset - 1;
  for (let i = 0; i < nLines; ++i) {
    const newIdx = s.lastIndexOf('\n', start) - 1;
    if (Math.abs(start - newIdx) > 200) {
      // probably compressed code
      start -= maxChars;
      break;
    }
    if (newIdx >= 0) {
      start = newIdx;
    }
  }
  let end = offset + 1;
  for (let i = 0; i <= nLines; ++i) {
    const newIdx = s.indexOf('\n', end) + 1;
    if (Math.abs(end - newIdx) > 200) {
      // probably compressed code
      end += maxChars;
      break;
    }
    if (newIdx >= 0) {
      end = newIdx;
    }
  }

  return s.substring(start, end);
}

/**
 * TODO: need to fix order. Probably: 1. babel -> 2. this
 * 
 * @see https://github.com/webpack/webpack/issues/4175#issuecomment-695767880
 */

export function makeDynamicRequireRule() {
  return {
    test: /\.js$/,
    loader: 'string-replace-loader',
    enforce: 'pre',
    options: {
      // match a require function call where the argument isn't a string literal
      search: /require\(\s*(?!\\?[\'"])/,
      // replace the 'require(' with a '__non_webpack_require__(', meaning it will require the files at runtime
      // $1 grabs the first capture group from the regex, the one character we matched and don't want to lose
      // replace: '__non_webpack_require__($1',
      // see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#Specifying_a_function_as_a_parameter
      replace: (match, offset, s) => {
        // const s = 'a\nb\nc\nd\ne\nf';
        // const offset = s.indexOf('c');
        // debugger;
        const requireLines = getLinesAroundOffset(s, offset, 1);

        // eslint-disable-next-line no-console
        console.warn(`Fixing dynamic require:\n`, /* match */requireLines, '\n\n');
        return `__non_webpack_require__(`;
      },

      flags: 'g'
    }
  };
}