// import truncate from 'lodash/truncate';

export function pathToStringAnnotated(path) {
  return `[${path.node.type}] "${pathToString(path)}"`;
}

export function loc2s(loc) {
  return `${loc.start.line}:${loc.start.column}`;
}

// function binding2s(binding) {
//   const p = binding.path.get('id') || binding.path;
//   const name = p.toString();
//   return `[${binding.path.node.type}] ${name} ${binding.scope.block.type} (${loc2s(binding.path.node.loc)})`;
// }

/**
 * NOTE: This is a slightly more adavanced version of `truncate(..., {length: MaxLen})`
 */
export function pathToString(path, addLoc = false, MaxLen = 100) {
  // TODO: remove comments from node

  let presentableString = path.toString();
  if (MaxLen && presentableString.length > MaxLen) {
    presentableString = presentableString.substring(0, MaxLen - 3).trim() + '...';
  }
  presentableString = presentableString
    // .replace(/[\r\n]/g, '')
    .replace(/\s+/g, ' ');      // replace any amount and type of whitespace with a single space
  if (addLoc) {
    presentableString = `${presentableString} @${loc2s(path.node.loc)}`;
  }
  return presentableString;
}