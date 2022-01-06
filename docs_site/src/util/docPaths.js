const pkgNames = {
  'dbux-code': 'Dbux VSCode Extension'
};

function join(a, b) {
  return `${(a && b) && `${a}/` || a || ''}${b || ''}`;
}

export function getPrettyPath(path) {
  const name = pkgNames[path];
  if (name) {
    return name;
  }

  // hackfix stuff
  if (path.startsWith('dbux-') && !path.startsWith('dbux-code')) {
    return `@dbux/${path.substring(5)}`;
  }

  return path;
}
