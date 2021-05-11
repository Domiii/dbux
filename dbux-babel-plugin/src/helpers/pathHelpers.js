import truncate from 'lodash/truncate';

export function pathToStringAnnotated(path) {
  return `[${path.node.type}] "${getPresentableString(path)}"`;
}

/**
 * NOTE: This is a slightly more adavanced version of `truncate(..., {length: MaxLen})`
 */
export function getPresentableString(path, MaxLen) {
  // TODO: remove comments
  
  let presentableString = path.toString();
  if (MaxLen && presentableString.length > MaxLen) {
    presentableString = presentableString.substring(0, MaxLen - 3).trim() + '...';
  }
  presentableString = presentableString
    // .replace(/[\r\n]/g, '')
    .replace(/\s+/g, ' ');      // replace any amount and type of whitespace with a single space
  return presentableString;
}