import generate from '@babel/generator';

export function getLine(path) {
  const { node: { loc } } = path;

  // loc's type is `SourceLocation`
  // see: https://github.com/babel/babel/tree/master/packages/babel-parser/src/util/location.js#L22

  return loc?.start?.line;
}

export function getPresentableString(path, MaxLen) {
  let presentableString = path.toString();
  if (MaxLen && presentableString.length > MaxLen) {
    presentableString = presentableString.substring(0, MaxLen - 3).trim() + '...';
  }
  presentableString = presentableString
    // .replace(/[\r\n]/g, '')
    .replace(/\s+/g, ' ');      // replace any amount and type of whitespace with a single space
  return presentableString;
}