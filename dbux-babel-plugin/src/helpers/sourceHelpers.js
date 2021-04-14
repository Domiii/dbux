import generate from '@babel/generator';


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
  let lines = linesByProgram.get(filePath);
  if (!lines) {
    const { file: { code } } = state;
    lines = code.split(NEWLINE);
    linesByProgram.set(filePath, lines);
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
    result = srcLines[line0]?.substring(col0, col1) || 
      `<failed to extract source at ${state.filePath}:${line0}: ${JSON.stringify(loc)}>`;
  }
  else {
    // multiple lines
    result = [
      srcLines[line0].substring(col0),
      ...srcLines.slice(line0 + 1, line1),
      srcLines[line1].substring(0, col1)
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