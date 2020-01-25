import generate from '@babel/generator';

export function getLine(path) {
  const { node: { loc } } = path;

  // loc's type is `SourceLocation`
  // see: https://github.com/babel/babel/tree/master/packages/babel-parser/src/util/location.js#L22

  return loc?.start?.line;
}

export function toSourceString(node) {
  return toSourceStringWithoutComments(node);
}

/**
 * NOTE: See link to understand how babel's `NodePath.toString` generates its code (utterly unoptimized)
 * @see https://github.com/babel/babel/blob/master/packages/babel-traverse/src/path/index.js#L156
 */
export function toSourceStringWithoutComments(node) {
  // NYI: don't generate code; rather use it's location to get the string from the input source
  // TODO: Still have to generate code in case its an instrumented node
  throw new Error('[DBUX] this is currently utterly unoptimized. Improve before use.');
  // return generate(node, { /* options */ }).code;
}

export function getPresentableString(path, MaxLen) {
  MaxLen = MaxLen || 40;
  let presentableString = path.toString();
  if (presentableString.length > MaxLen) {
    presentableString = presentableString.substring(0, MaxLen - 3).trim() + '...';
  }
  presentableString = presentableString.replace(/[\r\n]/g, '');
  return presentableString;
}