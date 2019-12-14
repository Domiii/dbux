import generate from '@babel/generator';

export function getLine(path) {
  const { node: {loc} } = path;

  // loc's type is `SourceLocation`
  // see: https://github.com/babel/babel/tree/master/packages/babel-parser/src/util/location.js#L22

  return loc?.start?.line;
}

export function toSourceString(ast) {
  return generate(ast, { /* options */ }).code;
}