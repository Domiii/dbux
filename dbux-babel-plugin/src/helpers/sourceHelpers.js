import generate from '@babel/generator';
import EmptyObject from '@dbux/common/src/util/EmptyObject';


/**
 * Reference: See link to understand how babel's `NodePath.toString` generates its code (utterly unoptimized)
 * @see https://github.com/babel/babel/blob/master/packages/babel-traverse/src/path/index.js#L156
 */
function generateSourceWithoutComments(node) {
  const options = {
    comments: false,

  };
  return generate(node, options).code;
}

/**
 * @see https://github.com/hulkish/babel/blob/master/packages/babel-code-frame/src/index.js#L30
 */
const NEWLINE = /\r\n|[\n\r\u2028\u2029]/;
const linesByProgram = new Map();

function getSourceCodeLines(state) {
  const { filePath/* , file: { code } */ } = state;
  let { lines, file: oldFile } = linesByProgram.get(filePath) || EmptyObject;
  // console.warn('[DBUX getSourceCodeLines]', JSON.stringify(state));
  const { file } = state;
  // if (oldFile !== file) {
  if (!lines) {
    // TODO: when using a bundler (e.g. Webpack), incremental builds can cause trouble. That's why we need to check `oldFile !== file` for proper identity identification. However, storing a reference to the actual file object causes a memory leak.
    // TODO: use WeakRef?
    const { code } = file;
    lines = code.split(NEWLINE);
    linesByProgram.set(filePath, { lines/* , file */ });
  }
  return lines;
}


/**
 * Based on `@babel/code-frame`, but more optimized
 * @see https://github.com/hulkish/babel/blob/master/packages/babel-code-frame/src/index.js
 */
function extractSourceAtLoc(srcLines, loc, state) {
  let line0 = loc.start.line - 1;
  const col0 = loc.start.column;
  let line1 = loc.end.line - 1;
  const col1 = loc.end.column;

  let result;
  if (line0 === line1) {
    // single line
    result = srcLines[line0]?.substring(col0, col1);
    if (!result) {
      result = `<failed to extract source at ${state.filePath}:${line0}: ${JSON.stringify(loc)}>`;
      // eslint-disable-next-line no-console
      console.warn('[DBUX babel-plugin]', result);
    }
  }
  else {
    // multiple lines
    result = [
      srcLines[line0].substring(col0),
      ...srcLines.slice(line0 + 1, line1),
      // TODO: apparently webpack keeps this cached, and it will not be updated correctly if file changed?
      srcLines[line1]?.substring(0, col1) || ''
    ].join('\n');
  }

  return result;
}

export function extractSourceStringWithoutComments(node, state) {
  // return generateSourceWithoutComments(node);
  return extractSourceStringWithoutCommentsAtLoc(node.loc, state);
}

export function extractSourceStringWithoutCommentsAtLoc(loc, state) {
  const srcLines = getSourceCodeLines(state);
  return extractSourceAtLoc(srcLines, loc, state);
}

// export function extractSourceString(node, state) {
//   return extractSourceStringWithoutComments(node, state);
// }

export function clearSourceHelperCache(state) {
  const { filePath/* , file: { code } */ } = state;
  linesByProgram.delete(filePath);
}