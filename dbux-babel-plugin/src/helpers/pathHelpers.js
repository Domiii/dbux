// import truncate from 'lodash/truncate';
import generator from '@babel/generator';

export function pathToStringAnnotated(path, ...args) {
  return `[${path.node.type}] "${pathToString(path, ...args)}"`;
}

export function locToString(loc) {
  return `${loc.start.line}:${loc.start.column}`;
}

// function binding2s(binding) {
//   const p = binding.path.get('id') || binding.path;
//   const name = p.toString();
//   return `[${binding.path.node.type}] ${name} ${binding.scope.block.type} (${locToString(binding.path.node.loc)})`;
// }

/**
 * NOTE: This is a slightly more adavanced version of `truncate(..., {length: MaxLen})`
 */
export function pathToString(path, addLoc = false, MaxLen = 80) {
  let s = astNodeToString(path.node, MaxLen);
  if (addLoc) {
    if (path.node.loc) {
      s = `${s} @${locToString(path.node.loc)}`;
    }
    else {
      s = `${s} @(no loc)`;
    }
  }
  return s;
}

/**
 * @see https://babeljs.io/docs/en/babel-generator#options
 */
const DefaultGenOptions = {
  comments: false,
  concise: true,
  decoratorsBeforeExport: false
};

export function astNodeToString(astNode, MaxLen = 100) {
  // NOTE: `path.toString()` is simply `generator(astNode).code`
  let s = generator(astNode, DefaultGenOptions).code;

  if (MaxLen && s.length > MaxLen) {
    s = s.substring(0, MaxLen - 3).trim() + '...';
  }
  return s
    // .replace(/[\r\n]/g, '')
    .replace(/\s+/g, ' ');      // replace any amount and type of whitespace with a single space
}
